import { Component, type OnInit } from "@angular/core"
import type { GroupEA_G, Rule, DiscountConditionGroupEA_C } from "@app/core/models/discount"
import { User } from "@app/core/models/User"
import { DiscountService } from "@app/core/services/discount.service"
import { BehaviorSubject, type Observable, combineLatest, map } from "rxjs"
import { Operator } from "@app/core/models/discount";
import { Console } from "node:console"

@Component({
  standalone: false,
  selector: "app-create-discount-group",
  templateUrl: "./create-discount-group.component.html",
  styleUrl: "./create-discount-group.component.css",
})
export class CreateDiscountGroupComponent implements OnInit {
  // Users mock data (for UI only)
  private usersSubject = new BehaviorSubject<User[]>([
    // ... your user mock data ...
    {
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
            role: "Admin",
            isVerified: true,
           
            createdDate: "2024-01-15",
            groupIds: [1, 2],
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane.smith@example.com",
            phone: "+1234567891",
            role: "Customer",
            isVerified: true,
         
            createdDate: "2024-01-20",
            groupIds: [1],
          },
          {
            id: 3,
            name: "Bob Johnson",
            email: "bob.johnson@example.com",
            phone: "+1234567892",
            role: "Customer",
            isVerified: false,
           
            createdDate: "2024-01-25",
            groupIds: [2, 3],
          },
          {
            id: 4,
            name: "Alice Brown",
            email: "alice.brown@example.com",
            phone: "+1234567893",
            role: "Moderator",
            isVerified: true,
         
            createdDate: "2024-02-01",
            groupIds: [1, 3, 4],
          },
          {
            id: 5,
            name: "Charlie Wilson",
            email: "charlie.wilson@example.com",
            phone: "+1234567894",
            role: "Customer",
            isVerified: true,
           
            createdDate: "2024-02-05",
            groupIds: [2, 4, 5],
          },
  ]);
  users$: Observable<User[]>;
  filteredUsers$: Observable<User[]>;

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

  constructor(private discountService: DiscountService) {
    this.users$ = this.usersSubject.asObservable();
    this.filteredUsers$ = this.users$;
  }

  ngOnInit(): void {
    this.setupFilteredData();
    this.loadGroups();
  }

  loadGroups() {
    this.discountService.getAllGroups().subscribe(groups => {
      this.groups = groups;
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
    this.filteredUsers$ = this.users$.pipe(
      map(users => users.filter(user => {
        const matchesSearch =
          user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesGroup =
          this.selectedGroup === "all" || user.groupIds.includes(Number.parseInt(this.selectedGroup));
        return matchesSearch && matchesGroup;
      }))
    );
  }

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
    return groups.filter((group) => user.groupIds.includes(group.id));
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
   
    this.isRuleBuilderOpen = true;
    this.isConditionPopupOpen = false;
    this.editingConditionIndex = null; // new condition
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
        conditionType: rule.type,
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

  // saveAllConditions(): void {
  //   if (this.conditionGroup) {
  //     const updatedGroup: GroupEA_G = {
  //       ...this.conditionGroup,
  //       discountConditionGroups: [...this.tempConditionGroups]
  //     };
      
  //     console.log('Complete Group Data:', updatedGroup);
  //     console.log('=========================================');
    
      
  //     this.closeConditionPopup();
  //   }
  // }

  saveAllConditions(): void {
    if (this.conditionGroup) {
      const updatedGroup: GroupEA_G = {
        ...this.conditionGroup,
        discountConditionGroups: [...this.tempConditionGroups]
      };
      console.log("HI");
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
          conditionType: rule.type,
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
}