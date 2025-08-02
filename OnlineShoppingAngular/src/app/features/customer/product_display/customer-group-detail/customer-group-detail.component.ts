import { Component, OnInit } from '@angular/core';
import { GroupService, GroupWithConditions } from '@app/core/services/group.service';

@Component({
  selector: 'app-customer-group-detail',
  standalone: false,
  templateUrl: './customer-group-detail.component.html',
  styleUrl: './customer-group-detail.component.css'
})
export class CustomerGroupDetailComponent implements OnInit {

  groupsWithConditions: GroupWithConditions[] = [];
  loading = true;
  error = '';

  constructor(private groupService: GroupService) { }

  ngOnInit(): void {
    this.loadGroupsWithConditions();
  }

  loadGroupsWithConditions(): void {
    this.loading = true;
    this.error = '';

    this.groupService.getAllGroupsWithConditions().subscribe({
      next: (data) => {
        this.groupsWithConditions = data;
        this.loading = false;
        console.log('Loaded groups with conditions:', data);
      },
      error: (error) => {
        this.error = 'Failed to load groups';
        this.loading = false;
        console.error('Error loading groups:', error);
      }
    });
  }

  getConditionTypeLabel(conditionType: string): string {
    switch (conditionType) {
      case 'CUSTOMER_GROUP': return 'Customer Group';
      case 'PRODUCT': return 'Product';
      case 'ORDER': return 'Order';
      case 'USER_STATUS': return 'User Status';
      default: return conditionType;
    }
  }

  getOperatorLabel(operator: string): string {
    switch (operator) {
      case 'IS_ONE_OF': return 'Is One Of';
      case 'GREATER_THAN_OR_EQUAL': return 'Greater Than or Equal';
      case 'LESS_THAN_OR_EQUAL': return 'Less Than or Equal';
      case 'EQUAL': return 'Is Equal To';
      case 'GREATER_THAN': return 'Is Greater Than';
      case 'LESS_THAN': return 'Is Less Than';
      default: return operator;
    }
  }

  getLogicOperatorLabel(logicOperator: boolean): string {
    return logicOperator ? 'AND' : 'OR';
  }

  formatConditionAsText(condition: any): string {
    const conditionType = this.getConditionTypeLabel(condition.conditionType);
    const conditionDetail = condition.conditionDetail;
    const operator = this.getOperatorLabel(condition.operator);
    const value = this.cleanValue(condition.value);

    // Handle different condition types
    switch (condition.conditionType) {
      case 'USER_STATUS':
        if (conditionDetail === 'last_login_date') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your last login date ${operatorText} ${value} days`;
        } else if (conditionDetail === 'days_since_signup') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your days since signup ${operatorText} ${value} days`;
        } else if (conditionDetail === 'days_since_last_purchase') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your days since last purchase ${operatorText} ${value} days`;
        } else if (conditionDetail === 'total_spent') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your total spent ${operatorText} ${value}`;
        } else if (conditionDetail === 'order_count') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your order count ${operatorText} ${value}`;
        }
        break;

      case 'ORDER':
        if (conditionDetail === 'total_spent') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your total spent ${operatorText} ${value}`;
        } else if (conditionDetail === 'order_count') {
          let operatorText = '';
          switch (condition.operator) {
            case 'EQUAL':
              operatorText = 'must be exactly';
              break;
            case 'GREATER_THAN':
              operatorText = 'must be more than';
              break;
            case 'LESS_THAN':
              operatorText = 'must be less than';
              break;
            default:
              operatorText = operator.toLowerCase();
          }
          return `Your order count ${operatorText} ${value}`;
        }
        break;

      default:
        return `${conditionType} ${conditionDetail} ${operator.toLowerCase()} ${value}`;
    }

    return `${conditionType} ${conditionDetail} ${operator.toLowerCase()} ${value}`;
  }

  private cleanValue(value: string): string {
    if (!value) return '';
    
    // Remove square brackets if they exist
    return value.replace(/^\[|\]$/g, '');
  }

  formatConditionGroupAsText(conditionGroup: any): string {
    if (!conditionGroup.discountCondition || conditionGroup.discountCondition.length === 0) {
      return 'No conditions';
    }

    const conditions = conditionGroup.discountCondition.map((condition: any) => 
      this.formatConditionAsText(condition)
    );

    // Return conditions as separate lines without AND/OR
    return conditions.join('\n');
  }

  hasGroupsWithConditions(): boolean {
    return this.groupsWithConditions.some(groupData => 
      groupData.conditionGroups && groupData.conditionGroups.length > 0
    );
  }
}
