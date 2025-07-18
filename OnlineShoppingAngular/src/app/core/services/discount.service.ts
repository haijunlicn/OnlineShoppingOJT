import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable, of } from "rxjs"
import { Brand, Category, City, DiscountConditionGroupEA_C, DiscountEA_A, GroupEA_G } from "../models/discount"
import { User } from "../models/User"
import { HttpClient } from "@angular/common/http"
import { ProductDTO } from "../models/product.model"
@Injectable({
  providedIn: 'root'
})
export class DiscountService {
   private apiUrl = "http://localhost:8080/api/discounts"

  constructor(private http: HttpClient) {}

  getAllGroups(): Observable<GroupEA_G[]> {
    return this.http.get<GroupEA_G[]>(`${this.apiUrl}/groups`);
  }

  createGroup(group: GroupEA_G): Observable<GroupEA_G> {
    return this.http.post<GroupEA_G>(`${this.apiUrl}/groups`, group);
  }

  updateGroup(group: GroupEA_G): Observable<GroupEA_G> {
    return this.http.put<GroupEA_G>(`${this.apiUrl}/groups/${group.id}`, group);
  }

  deleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}`);
  }

  getGroupById(groupId: number): Observable<GroupEA_G> {
    return this.http.get<GroupEA_G>(`${this.apiUrl}/groups/${groupId}`);
  }


  //getbrands and categories 
  getAllBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/brands`);
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }
  getAllProducts(): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.apiUrl}/products`);
  }



 
  createDiscount(discount: DiscountEA_A): Observable<string> {
    return this.http.post(`${this.apiUrl}/createDiscount`, discount, { responseType: 'text' });
  }

  // READ (all)
  getAllDiscounts(): Observable<DiscountEA_A[]> {
    return this.http.get<DiscountEA_A[]>(`${this.apiUrl}/selectallDiscount`);
  }

  // READ (by id)
  getDiscountById(id: number): Observable<DiscountEA_A> {
    return this.http.get<DiscountEA_A>(`${this.apiUrl}/selectdiscountbyId/${id}`);
  }

  // // UPDATE
  updateDiscount(id: number, discount: DiscountEA_A): Observable<DiscountEA_A> {
    return this.http.put<DiscountEA_A>(`${this.apiUrl}/updateDiscount/${id}`, discount);
  }

  // DELETE
  deleteDiscount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteDisount/${id}`);
  }

  updateDiscountStatus(id: number, payload: { isActive: boolean }) {
    return this.http.patch(`${this.apiUrl}/updateDiscountStatus/${id}`, payload);
  }

  // groupConditions
  saveGroupConditions(group: GroupEA_G): Observable<string> {
    // POST to /groups/{id}/conditions
    return this.http.post(`${this.apiUrl}/groups/${group.id}/conditions`, group, { responseType: 'text' });
  }

  // Get all condition groups for a group
getGroupConditions(groupId: number): Observable<DiscountConditionGroupEA_C[]> {
  return this.http.get<DiscountConditionGroupEA_C[]>(`${this.apiUrl}/groups/${groupId}/conditions`);
}

// Delete a condition group by id
deleteConditionGroup(conditionGroupId: number): Observable<string> {
  return this.http.delete(`${this.apiUrl}/conditionGroups/${conditionGroupId}`, { responseType: 'text' });
}
}
