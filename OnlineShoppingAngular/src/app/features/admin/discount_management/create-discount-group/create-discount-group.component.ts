import { Component, type OnInit } from "@angular/core"
import type { GroupEA_G, Rule, DiscountConditionGroupEA_C } from "@app/core/models/discount"
import { User } from "@app/core/models/User"
import { DiscountService } from "@app/core/services/discount.service"
import { BehaviorSubject, type Observable, combineLatest, map, of } from "rxjs"
import { Operator } from "@app/core/models/discount";
import { Console } from "node:console"
import { AdminAccountService } from "@app/core/services/admin-account.service"
import { colorSets } from '@swimlane/ngx-charts';
import Swal from 'sweetalert2';

// Chart data interface
interface ChartDataItem {
  name: string;
  value: number;
  extra?: {
    percentage: number;
  };
}

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

  allUsers: User[] = []; // Local storage

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

  // Chart properties
  chartData: ChartDataItem[] = [];
  chartView: [number, number] = [700, 400];
  chartColorScheme = {
    name: 'custom',
    selectable: true,
    group: 'Ordinal',
    domain: [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
      '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#a8edea', '#fed6e3'
    ]
  } as any;
  chartShowLegend = true;
  chartShowXAxis = true;
  chartShowYAxis = true;
  chartShowXAxisLabel = true;
  chartShowYAxisLabel = true;
  chartXAxisLabel = 'Customer Groups';
  chartYAxisLabel = 'Number of Users';
  chartGradient = true;
  chartShowDataLabel = true;
  chartBarPadding = 8;
  chartRoundEdges = true;
  chartTooltipDisabled = false;
  chartAnimations = true;

  // Pie chart for city user counts
  cityUserCounts: any[] = [];
  townshipPieData: any[] = [];
  cityList: string[] = [];
  selectedCity: string = '';
  filterActive: boolean = false;
  orderStatus: 'all' | 'ordered' | 'notOrdered' = 'all';
  unorderCity: string = '';

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
    this.loadCityUserCounts();
  }

  loadGroups() {
    this.discountService.getAllGroups().subscribe(groups => {
      this.groups = groups;
      this.generateChartData(); // Generate chart after groups loaded (may be called again after users loaded)
    });
  }

  loadUsers(): void {
    this.accountService.getAllCustomers().subscribe({
      next: (users) => {
        this.accountService.getUserStats().subscribe({
          next: (stats) => {
            const statsMap = new Map(stats.map((s: any) => [s.userId, s]));
            this.allUsers = users.map(user => {
              const stat = statsMap.get(user.id);
              return {
                ...user,
                orderCount: stat ? stat.orderCount : 0,
                totalSpent: stat ? stat.totalSpent : 0
              };
            });
            this.setupFilteredData();
            this.generateChartData(); // Generate chart after users loaded
          },
          error: (err) => {
            console.error("Failed to load user stats:", err);
            this.allUsers = users;
            this.setupFilteredData();
            this.generateChartData();
          }
        });
      },
      error: (err) => {
        console.error("Failed to load users:", err);
      }
    });
  }

  loadCityUserCounts() {
    this.accountService.getUserCountsByCity().subscribe(data => {
      this.cityUserCounts = data
        .filter(item => item.city && item.count && !isNaN(Number(item.count)))
        .map(item => ({ name: item.city, value: Number(item.count) }))
        .filter(item => item.value > 0);
      this.cityList = this.cityUserCounts.map(item => item.name);
      this.filterActive = false;
      this.selectedCity = '';
      this.townshipPieData = [];
    });
  }

  onCityChange() {
    if (!this.selectedCity) {
      this.clearFilter();
      return;
    }
    this.filterActive = true;
    this.accountService.getUserCountsByTownshipWithOrder(this.selectedCity).subscribe(data => {
      this.townshipPieData = data
        .filter(item => item.township && item.count && !isNaN(Number(item.count)))
        .map(item => ({
          name: `${item.township} (Ordered: ${item.orderedCount || 0})`,
          value: Number(item.count),
          orderedCount: Number(item.orderedCount) || 0,
          rawTownship: item.township
        }))
        .filter(item => item.value > 0 && item.orderedCount > 0);
    });
  }

  clearFilter() {
    this.selectedCity = '';
    this.filterActive = false;
    this.townshipPieData = [];
  }

  loadCityList() {
    // Get all cities for dropdown (from city user counts)
    this.accountService.getUserCountsByCity().subscribe(data => {
      this.cityList = data.map(item => item.city).filter((c: string) => !!c);
      if (this.cityList.length > 0) {
        this.selectedCity = this.cityList[0];
        this.loadTownshipPieData();
      }
    });
  }

  onOrderFilterChange() {
    this.loadTownshipPieData();
  }

  onUnorderCityChange() {
    this.filterActive = true;
    this.loadTownshipPieData();
  }

  onOrderStatusChange() {
    if (this.orderStatus === 'notOrdered') {
      this.unorderCity = '';
    }
    if (this.filterActive) {
      this.loadTownshipPieData();
    }
  }

  loadTownshipPieData() {
    if (this.orderStatus === 'notOrdered') {
      if (!this.unorderCity) {
        // Show un-ordered users by city
        this.accountService.getUserCountsByCity().subscribe(data => {
          this.cityUserCounts = data
            .filter(item => item.city && item.count && !isNaN(Number(item.count)))
            .map(item => ({
              name: item.city,
              value: Number(item.count),
              orderedCount: Number(item.orderedCount) || 0
            }))
            .filter(item => item.value > 0 && item.orderedCount === 0);
        });
      } else {
        // Show un-ordered users by township in selected city
        this.accountService.getUserCountsByTownshipWithOrder(this.unorderCity).subscribe(data => {
          this.townshipPieData = data
            .filter(item => item.township && item.count && !isNaN(Number(item.count)))
            .map(item => ({
              name: `${item.township} (Ordered: ${item.orderedCount || 0})`,
              value: Number(item.count),
              orderedCount: Number(item.orderedCount) || 0,
              rawTownship: item.township
            }))
            .filter(item => item.value > 0 && item.orderedCount === 0);
        });
      }
    } else {
      // Existing logic for ordered/all
      this.accountService.getUserCountsByTownshipWithOrder(this.selectedCity).subscribe(data => {
        this.townshipPieData = data
          .filter(item => item.township && item.count && !isNaN(Number(item.count)))
          .map(item => ({
            name: `${item.township} (Ordered: ${item.orderedCount || 0})`,
            value: Number(item.count),
            orderedCount: Number(item.orderedCount) || 0,
            rawTownship: item.township
          }))
          .filter(item => {
            if (this.orderStatus === 'ordered') return item.orderedCount > 0;
            return item.value > 0;
          });
      });
    }
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
    this.generateChartData(); // Update chart when filters change
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
    Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this condition group?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait while we delete the condition group.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.discountService.deleteConditionGroup(conditionGroupId).subscribe({
          next: () => {
            this.loadViewConditions();
            Swal.fire({
              title: 'Deleted!',
              text: 'Condition group has been deleted successfully.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            Swal.fire({
              title: 'Error!',
              text: 'Failed to delete condition group. Please try again.',
              icon: 'error'
            });
          }
        });
      }
    });
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

  getTownshipTooltip = (data: any) => {
    return `
      <div style="padding: 8px;">
        <div><b>${data.rawTownship || data.name}</b></div>
        <div>Total Users: ${data.value}</div>
        <div style="color: #43e97b; font-weight: 500;">Ordered Users: ${data.orderedCount}</div>
      </div>
    `;
  };

  /**
   * Generate chart data for ngx-charts bar chart.
   * For each filtered group, show the number of filtered users in that group.
   */
  generateChartData() {
    // Get filtered users (sync)
    let filteredUsers: User[] = this.allUsers;
    if (this.filteredUsers$) {
      // Try to get the latest filtered users synchronously (since filteredUsers$ is an observable of([]))
      this.filteredUsers$.subscribe(users => {
        filteredUsers = users;
      }).unsubscribe();
    }
    
    // Use filtered groups
    const groups = this.filteredGroups;
    this.chartData = groups.map(group => {
      const userCount = filteredUsers.filter(u => (u.groupIds || []).includes(group.id)).length;
      return {
        name: group.name,
        value: userCount,
        extra: {
          percentage: this.allUsers.length > 0 ? Math.round((userCount / this.allUsers.length) * 100) : 0
        }
      };
    });
    
    // Optionally, add 'All Customers' as a bar
    if (this.selectedGroup === 'all') {
      this.chartData.unshift({ 
        name: 'All Customers', 
        value: filteredUsers.length,
        extra: {
          percentage: 100
        }
      });
    }
    
    // Sort by value descending for better visualization
    this.chartData.sort((a, b) => b.value - a.value);
  }
}