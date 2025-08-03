import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GroupEntity {
  id: number;
  name: string;
  createDate: string;
  updateDate: string;
}

export interface DiscountConditionEntity {
  id: number;
  conditionType: string;
  conditionDetail: string;
  operator: string;
  value: string;
  delFg: boolean;
}

export interface DiscountConditionGroupEntity {
  id: number;
  logicOperator: boolean;
  discountCondition: DiscountConditionEntity[];
}

export interface GroupWithConditions {
  group: GroupEntity;
  conditionGroups: DiscountConditionGroupEntity[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private baseUrl = 'http://localhost:8080/api/groups';

  constructor(private http: HttpClient) { }

  getAllGroups(): Observable<GroupEntity[]> {
    return this.http.get<GroupEntity[]>(`${this.baseUrl}/all`);
  }

  getGroupDetails(groupId: number): Observable<GroupWithConditions> {
    return this.http.get<GroupWithConditions>(`${this.baseUrl}/${groupId}/details`);
  }

  getAllGroupsWithConditions(): Observable<GroupWithConditions[]> {
    return this.http.get<GroupWithConditions[]>(`${this.baseUrl}/all-with-conditions`);
  }

  getAllPublicGroupsWithConditions(): Observable<GroupWithConditions[]> {
    return this.http.get<GroupWithConditions[]>(`${this.baseUrl}/public/all-with-conditions`);
  }
  
} 