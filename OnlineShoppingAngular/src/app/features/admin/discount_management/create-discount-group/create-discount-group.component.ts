import { Component, type OnInit } from "@angular/core"
import type { GroupEA_G, Rule, DiscountConditionGroupEA_C } from "@app/core/models/discount"
import { User } from "@app/core/models/User"
import { DiscountService } from "@app/core/services/discount.service"
import { BehaviorSubject, type Observable, combineLatest, map, of } from "rxjs"
import { Operator } from "@app/core/models/discount";
import { Console } from "node:console"
import { AdminAccountService } from "@app/core/services/admin-account.service"

@Component({
  standalone: false,
  selector: "app-create-discount-group",
  templateUrl: "./create-discount-group.component.html",
  styleUrl: "./create-discount-group.component.css",
})
export class CreateDiscountGroupComponent implements OnInit {

  // users$: Observable<User[]>;
  // filteredUsers$: Observable<User[]>;

  // users$: Observable<User[]>;
  // filteredUsers$: Observable<User[]>;

  users$!: Observable<User[]>;
  filteredUsers$!: Observable<User[]>;

  private allUsers: User[] = []; // Local storage

  // Component state
  searchTerm = ""
  groupSearchTerm = ""
  selectedGroup = "all"
  newGroupName = ""
  editingGroup: GroupEA_G | null = null
  isCreateGroupDialogOpen = false
  isEditGroupDialogOpen = false
  isConditionBuilderOpen = false
  conditionGroup: GroupEA_G | null = null
  groups: GroupEA_G[] = [];

  // New state variables for condition popup
  isConditionPopupOpen = false;
  conditionPopupTab: 'add' | 'view' = 'add';
  tempConditionGroups: DiscountConditionGroupEA_C[] = [];
  isRuleBuilderOpen = false;
  editingConditionIndex: number | null = null;

  constructor(
    private discountService: DiscountService,
    private accountService: AdminAccountService
  ) {
    // this.users$ = this.usersSubject.asObservable();
    // this.filteredUsers$ = this.users$;
  }

  ngOnInit(): void {
    this.setupFilteredData();
    this.loadGroups();
    this.loadUsers();
  }

  loadGroups() {
    this.discountService.getAllGroups().subscribe(groups => {
      this.groups = groups;
    });
  }

  loadUsers(): void {
    this.accountService.getAllCustomers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.setupFilteredData();
      },
      error: (err) => {
        console.error("Failed to load users:", err);
      }
    });
  }

  // --- Group CRUD ---
  createGroup(): void {
    if (this.newGroupName.trim()) {
      const newGroup: GroupEA_G = {
        id: 0,
        name: this.newGroupName.trim(),
        createDate: '',
        updateDate: '',
        customerGroup: [],
        discountConditionGroups: []
      };
      this.discountService.createGroup(newGroup).subscribe(() => {
        this.closeCreateGroupDialog();
        this.loadGroups();
      });
    }
  }

  updateGroupName(): void {
    if (this.editingGroup && this.newGroupName.trim()) {
      const updatedGroup: GroupEA_G = {
        ...this.editingGroup,
        name: this.newGroupName.trim(),
        createDate: this.editingGroup.createDate || '',
        updateDate: this.editingGroup.updateDate || '',
        customerGroup: this.editingGroup.customerGroup || [],
        discountConditionGroups: this.editingGroup.discountConditionGroups || []
      };
      this.discountService.updateGroup(updatedGroup).subscribe(() => {
        this.closeEditGroupDialog();
        this.loadGroups();
      });
    }
  }

  confirmDeleteGroup(groupId: number): void {
    if (confirm("Are you sure you want to delete this group?")) {
      this.discountService.deleteGroup(groupId).subscribe(() => {
        if (this.selectedGroup === groupId.toString()) {
          this.selectedGroup = "all";
        }
        this.loadGroups();
      });
    }
  }

  // --- Filtering Logic ---
  private setupFilteredData(): void {
    this.filteredUsers$ = of(this.allUsers as User[]).pipe(
      map((users: User[]) =>
        users.filter(user => {
          const matchesSearch =
            user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
          const matchesGroup =
            this.selectedGroup === "all" || user.groupIds!.includes(Number.parseInt(this.selectedGroup));
          return matchesSearch && matchesGroup;
        })
      )
    );
  }

  // private setupFilteredData(): void {
  //   this.filteredUsers$ = this.allUsers.pipe(
  //     map((users) => users.filter(user => {
  //       const matchesSearch =
  //         user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
  //         user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
  //       const matchesGroup =
  //         this.selectedGroup === "all" || user.groupIds!.includes(Number.parseInt(this.selectedGroup));
  //       return matchesSearch && matchesGroup;
  //     }))
  //   );
  // }

  get filteredGroups(): GroupEA_G[] {
    if (!this.groupSearchTerm.trim()) return this.groups;
    return this.groups.filter(g =>
      g.name.toLowerCase().includes(this.groupSearchTerm.toLowerCase())
    );
  }

  onSearchChange(): void {
    this.setupFilteredData();
  }
  onGroupSearchChange(): void {
    // No need to update observable, just triggers getter
  }
  onGroupFilterChange(): void {
    this.setupFilteredData();
  }

  getUserGroups(user: User, groups: GroupEA_G[]): GroupEA_G[] {
    const ids = user.groupIds || [];
    return groups.filter((group) => ids.includes(group.id));
  }

  // --- Group management methods ---
  openCreateGroupDialog(): void {
    this.isCreateGroupDialogOpen = true;
  }
  closeCreateGroupDialog(): void {
    this.isCreateGroupDialogOpen = false;
    this.newGroupName = "";
  }
  openEditGroupDialog(group: GroupEA_G): void {
    this.editingGroup = group;
    this.newGroupName = group.name;
    this.isEditGroupDialogOpen = true;
  }
  closeEditGroupDialog(): void {
    this.isEditGroupDialogOpen = false;
    this.editingGroup = null;
    this.newGroupName = "";
  }

  // --- Condition popup methods ---
  openConditionPopup(group: GroupEA_G): void {

    this.conditionGroup = group;
    this.isConditionPopupOpen = true;
    this.conditionPopupTab = 'add';
    // Initialize tempConditionGroups from group.discountConditionGroups or empty array
    this.tempConditionGroups = group.discountConditionGroups ? [...group.discountConditionGroups] : [];

  }

  closeConditionPopup(): void {
    this.isConditionPopupOpen = false;
    this.conditionGroup = null;
    this.tempConditionGroups = [];
    this.isRuleBuilderOpen = false;
    this.editingConditionIndex = null;
  }

  openAddCondition(): void {
    // Open rule builder in group mode
    this.isRuleBuilderOpen = true;
    this.isConditionPopupOpen = false;
    this.editingConditionIndex = null; // new condition
    // Pass group mode to discount-rules component via [group]
    // (No code change needed here, but ensure [group] is set in the template)
  }

  editCondition(index: number): void {

    this.isRuleBuilderOpen = true;
    this.isConditionPopupOpen = false;
    this.editingConditionIndex = index;
  }

  closeRuleBuilder(): void {

    this.isRuleBuilderOpen = false;
    this.isConditionPopupOpen = true;
    this.editingConditionIndex = null;
  }

  onRuleBuilderSave(data: { logicType: string; rules: Rule[] }): void {


    // Map rules to DiscountConditionEA_D[]
    const discountConditionGroup: DiscountConditionGroupEA_C = {
      logicOperator: data.logicType,
      discountCondition: data.rules.map((rule, index) => ({
        conditionType: rule.type === 'status' ? 'USER_STATUS' : rule.type.toUpperCase(),
        conditionDetail: rule.field,
        operator: this.mapOperator(rule.operator),
        value: rule.values,
      })),
    };

    if (this.editingConditionIndex !== null) {
      // Edit existing condition
      this.tempConditionGroups[this.editingConditionIndex] = discountConditionGroup;


    } else {
      // Add new condition
      this.tempConditionGroups.push(discountConditionGroup);

    }

    this.closeRuleBuilder();
  }


  saveAllConditions(): void {
    if (this.conditionGroup) {
      const updatedGroup: GroupEA_G = {
        ...this.conditionGroup,
        discountConditionGroups: [...this.tempConditionGroups]
      };
      console.log("HI");
      console.log(updatedGroup);
      // Call backend to save
      this.discountService.saveGroupConditions(updatedGroup).subscribe({
        next: (res) => {
          console.log('Saved to backend:', res);
          this.closeConditionPopup();
          this.loadGroups();
        },
        error: (err) => {
          console.error('Error saving group conditions:', err);
        }
      });
    }
  }



  removeCondition(index: number): void {
    this.tempConditionGroups.splice(index, 1);
  }



  // Add to component state
  viewConditionGroups: DiscountConditionGroupEA_C[] = [];

  // When opening View Condition tab
  loadViewConditions() {
    if (this.conditionGroup?.id) {
      this.discountService.getGroupConditions(this.conditionGroup.id).subscribe(data => {
        this.viewConditionGroups = data;
      });
    }
  }

  // Delete handler
  deleteConditionGroup(conditionGroupId: number) {
    if (confirm('Are you sure you want to delete this condition group?')) {
      this.discountService.deleteConditionGroup(conditionGroupId).subscribe(() => {
        this.loadViewConditions();
      });
    }
  }
  // When switching to View Condition tab
  onTabChange(tab: 'add' | 'view') {
    this.conditionPopupTab = tab;
    if (tab === 'view') {
      this.loadViewConditions();
    }
  }



  // --- Condition builder methods (legacy - keeping for compatibility) ---
  openConditionBuilder(group: GroupEA_G): void {

    this.conditionGroup = group;
    this.isConditionBuilderOpen = true;

  }

  closeConditionBuilder(): void {
    this.isConditionBuilderOpen = false;
    this.conditionGroup = null;
  }

  private mapOperator(operator: string): Operator {
    switch (operator) {
      case 'equals': return Operator.EQUAL;
      case 'greater_than': return Operator.GREATER_THAN;
      case 'less_than': return Operator.LESS_THAN;
      case 'greater_equal': return Operator.GREATER_THAN_OR_EQUAL;
      case 'less_equal': return Operator.LESS_THAN_OR_EQUAL;
      case 'one_of': return Operator.IS_ONE_OF;
      default: return Operator.EQUAL;
    }
  }

  onConditionsSaved(data: { logicType: string; rules: Rule[] }): void {
    if (this.conditionGroup) {
      // Map rules to DiscountConditionEA_D[]
      const discountConditionGroup = {
        logicOperator: data.logicType,
        discountCondition: data.rules.map((rule, index) => ({
          conditionType: rule.type === 'status' ? 'USER_STATUS' : rule.type.toUpperCase(),
          conditionDetail: rule.field,
          operator: this.mapOperator(rule.operator),
          value: rule.values,
        })),
      };
      const updatedGroup: GroupEA_G = {
        ...this.conditionGroup,
        discountConditionGroups: [discountConditionGroup]
      };
      this.discountService.updateGroup(updatedGroup).subscribe(() => {
        this.loadGroups();
        this.closeConditionBuilder();
      });
    }
  }

  clearAllFilters(): void {
    this.searchTerm = "";
    this.groupSearchTerm = "";
    this.selectedGroup = "all";
    this.setupFilteredData();
  }

  get conditionRules(): Rule[] {
    const group = this.conditionGroup;
    const conds = group?.discountConditionGroups?.[0]?.discountCondition || [];

    return conds.map((c: any) => ({
      id: c.id?.toString() || '',
      type: c.conditionType || '',
      field: c.conditionDetail || '',
      operator: c.operator || '',
      values: c.value || [],
    }));
  }

  getConditionRules(index: number): Rule[] {
    const condition = this.tempConditionGroups[index];
    if (!condition || !condition.discountCondition) return [];

    return condition.discountCondition.map((c: any) => ({
      id: c.id?.toString() || '',
      type: c.conditionType || '',
      field: c.conditionDetail || '',
      operator: c.operator || '',
      values: c.value || [],
    }));
  }

  // User-friendly logic label
  getLogicLabel(logicOperator: string | boolean): string {
    // logicOperator may be string ('true'/'false') or boolean (true/false)
    if (logicOperator === true || logicOperator === 'true') {
      return 'All of the conditions are matched';
    } else {
      return 'Any of the conditions are matched';
    }
  }

  // User-friendly condition display
  getConditionDisplay(cond: any): string {
    const operatorMap: { [key: string]: string } = {
      EQUAL: 'is equal to',
      GREATER_THAN: 'is greater than',
      LESS_THAN: 'is less than',
      GREATER_THAN_OR_EQUAL: 'is greater than or equal to',
      LESS_THAN_OR_EQUAL: 'is less than or equal to',
      IS_ONE_OF: 'is one of',
      equals: 'is equal to',
      greater_than: 'is greater than',
      less_than: 'is less than',
      greater_equal: 'is greater than or equal to',
      less_equal: 'is less than or equal to',
      one_of: 'is one of',
    };
    return `${this.getFieldLabel(cond.conditionDetail)} ${operatorMap[cond.operator] || cond.operator} ${cond.value ? cond.value.join(', ') : ''}`;
  }

  // Field label mapping
  getFieldLabel(field: string): string {
    const fieldMap: { [key: string]: string } = {
      last_login_date: 'Last Login Date',
      days_since_signup: 'Days Since Signup',
      total_spent: 'Total Spent',
      days_since_last_purchase: 'Days Since Last Purchase',
      account_age_days: 'Account Age Days',
      // Add more as needed
    };
    return fieldMap[field] || field;
  }
}