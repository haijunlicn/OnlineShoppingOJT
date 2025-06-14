import { Component, type OnInit } from "@angular/core"

import { discount_management } from "../../../../core/services/discounManagement"
import { User } from "../../../../core/models/User"
import { DiscountGroup } from "../../../../core/models/discountGroup";
import { UserResponse } from "../../../../core/models/UserResponse";
import { AlertService } from "../../../../core/services/alert.service";
import Swal from "sweetalert2";



// interface User {
//   id: number
//   name: string
//   email: string
//   phone: string
//   role_id: number
//   is_verified: boolean
//   created_date: string
// }



@Component({
  selector: 'app-discount-group',
  standalone: false,
  templateUrl: './discount-group.component.html',
  styleUrl: './discount-group.component.css'

})
export class DiscountGroupComponent implements OnInit {
 
  users: User[] = [];

  
  discountGroups: DiscountGroup[] = [];

  selectedUsers: number[] = []
  newGroupName = ""
  selectedGroupId = ""
  activeTab = "groups"
  isCreateDialogOpen = false
  isAssignDialogOpen = false
  showToast = false
  toastMessage = ""
  toastType: "success" | "error" = "success"
  isEditGroupDialogOpen = false
  isManageMembersDialogOpen = false
  editingGroup: DiscountGroup | null = null
  
  editGroupName = ""
  // groupMembers: User[] = []
  groupMembers: UserResponse[] = []

  selectedMembersToRemove: number[] = []
  isExportDialogOpen = false
  exportFormat: "csv" | "excel" = "csv"
  exportType: "all" | "single" = "all"
  selectedExportGroupId = ""
 ngOnInit() {
  this.discountGroupService.getDiscountUserGroupMembers().subscribe({
    next: (groups) => {
     
      this.discountGroups = groups;
    }
  });

  this.discountGroupService.getUsers().subscribe({
  next: (users) => {
   
    users.forEach(user => {
    
    });
    this.users = users; // Component variable ထဲသွင်းထား
  },

});

}

 constructor(private discountGroupService: discount_management,private alert:AlertService){

  }

  // Add getter methods for template calculations
  get selectedGroupName(): string {
    if (this.exportType === "single" && this.selectedExportGroupId) {
      const group = this.discountGroups.find((g) => g.id === Number(this.selectedExportGroupId))
      return group ? group.name : ""
    }
    return ""
  }

  get estimatedRecords(): number {
    if (this.exportType === "all") {
      return this.discountGroups.reduce((sum, g) => sum + g.member_count, 0)
    } else if (this.selectedExportGroupId) {
      const group = this.discountGroups.find((g) => g.id === Number(this.selectedExportGroupId))
      return group ? group.member_count : 0
    }
    return 0
  }

  handleUserSelection(userId: number, event: any): void {
    if (event.target.checked) {
      this.selectedUsers.push(userId)
    } else {
      this.selectedUsers = this.selectedUsers.filter((id) => id !== userId)
    }
  }

  handleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedUsers = this.users.map((user) => user.id)
    } else {
      this.selectedUsers = []
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId)
  }

  areAllUsersSelected(): boolean {
    return this.selectedUsers.length === this.users.length
  }

  
  handleCreateGroup(): void {
  if (!this.newGroupName.trim()) {
    this.showToastMessage("Please enter group name", "error");
    return;
  }

  const newGroupPayload = {
    name: this.newGroupName
  };

  this.discountGroupService.createDiscountGroup(newGroupPayload).subscribe({
    next: (groupUrl: string) => { 
      this.showToastMessage("New discount group created successfully", "success");
      this.newGroupName = "";
      this.isCreateDialogOpen = false;
      
       // Refresh the group members
      this.discountGroupService.getDiscountUserGroupMembers().subscribe({
  next: (groups) => {
   
    this.discountGroups = groups;
   


  },
  error: (err) => {
    console.error('Failed to load discount user groups', err);
  }
});




    },
    error: (error) => {
      this.showToastMessage("Failed to create discount group", "error");
    }
  });
}



  handleAssignUsers(): void {
    if (this.selectedUsers.length === 0) {
      this.showToastMessage("Please select users", "error")
      return
    }

    if (!this.selectedGroupId) {
      this.showToastMessage("Please select a group", "error")
      return
    }
    const groupIndex = this.discountGroups.findIndex((group) => group.id === Number.parseInt(this.selectedGroupId))


//////////////////////////
 this.discountGroupService.assignUsersToGroup(Number.parseInt(this.selectedGroupId), this.selectedUsers)
    .subscribe({
      next: (response) => {
        this.showToastMessage("Users added to group successfully", "success");

        const groupIndex = this.discountGroups.findIndex((group) => group.id === Number.parseInt(this.selectedGroupId));
        if (groupIndex !== -1) {
          this.discountGroups[groupIndex].member_count += this.selectedUsers.length;
        }

        this.selectedUsers = [];
        this.selectedGroupId = "";
        this.isAssignDialogOpen = false;
      },
      error: (err) => {

         this.showToastMessage(err.error, "error");
        console.error(err);
      }
    });
    //////////////////////////////
    this.isAssignDialogOpen = false
    this.showToastMessage(`Users added to group successfully`, "success")
  }



  handleDeleteGroup(groupId: number): void {
     
  ///////////////////////////////
  this.discountGroupService.deleteDiscountGroup(groupId).subscribe({
    next: (response: string) => { 
      

      this.discountGroups = this.discountGroups.filter((group) => group.id !== groupId);
      this.discountGroupService.getDiscountUserGroupMembers().subscribe({
    next: (groups) => {
     
      this.discountGroups = groups;
    }
  });
      this.showToastMessage("Group deleted successfully", "success");
    },
    error: () => {
      this.showToastMessage("Failed to delete group", "error");
    }
  });
//////////////////////////
    this.showToastMessage("Group deleted successfully", "success")
  }



  setActiveTab(tab: string): void {
    this.activeTab = tab
    
 this.discountGroupService.getDiscountUserGroupMembers().subscribe({
  next: (groups) => {
   
    this.discountGroups = groups;
  },
  error: (err) => {
    console.error('Failed to load discount user groups', err);
  }
});

this.discountGroupService.getUsers().subscribe({
  next: (users) => {
  
    users.forEach(user => {
     
    });
    this.users = users; // Component variable ထဲသွင်းထား
  },

});
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen = true
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen = false
    this.newGroupName = ""
  }

  openAssignDialog(): void {
    this.isAssignDialogOpen = true
  }

  closeAssignDialog(): void {
    this.isAssignDialogOpen = false
    this.selectedGroupId = ""
  }

  showToastMessage(message: string, type: "success" | "error"): void {
    this.toastMessage = message
    this.toastType = type
    this.showToast = true
    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }

  closeToast(): void {
    this.showToast = false
  }


selectedGroupIdForEdit: number | null = null;

  openEditGroupDialog(group: DiscountGroup): void {
   
    this.editingGroup = group
    this.editGroupName = group.name
 this.selectedGroupIdForEdit = group.id; 
  
    this.isEditGroupDialogOpen = true
    
  }


// handleEditGroup(): void {
//     if (!this.editGroupName.trim()) {
//       this.showToastMessage("Please enter group name", "error")
//       return
//     }


//     this.closeEditGroupDialog()
//     this.showToastMessage("Group name updated successfully", "success")
//   }


handleEditGroup(): void {
  if (!this.editGroupName.trim()) {
    this.showToastMessage("Please enter group name", "error");
    return;
  }

  if (this.editingGroup) {
    this.discountGroupService.updateGroupName(this.editingGroup.id, this.editGroupName).subscribe({
      next: (response) => {
        // Update local array to reflect new name
        const groupIndex = this.discountGroups.findIndex(g => g.id === this.editingGroup!.id);
        if (groupIndex !== -1) {
          this.discountGroups[groupIndex].name = this.editGroupName;
        }
        this.closeEditGroupDialog();
       this.showToastMessage("Group name updated successfully", "success")
      },
      error: (err) => {
        this.showToastMessage("Failed to update group name: " + err.message, "error");
      }
    });
  }
}



  closeEditGroupDialog(): void {
    this.isEditGroupDialogOpen = false
    this.editingGroup = null
    this.editGroupName = ""
  }

  


  groupName: string | null = null; 


openManageMembersDialog(members: UserResponse[],groupNamed:string): void {
   this.groupName=groupNamed
  this.groupMembers = members; 
  this.selectedMembersToRemove = [];
  this.isManageMembersDialogOpen = true;
}

 

  
  closeManageMembersDialog(): void {
    this.isManageMembersDialogOpen = false
    this.editingGroup = null
    this.groupMembers = []
    this.selectedMembersToRemove = []
  }

  handleMemberSelection(userId: number, event: any): void {
    if (event.target.checked) {
      this.selectedMembersToRemove.push(userId)
    } else {
      this.selectedMembersToRemove = this.selectedMembersToRemove.filter((id) => id !== userId)
    }
  }

  isMemberSelected(userId: number): boolean {
    return this.selectedMembersToRemove.includes(userId)
  }












  handleRemoveMembers(): void {
    if (this.selectedMembersToRemove.length === 0) {
      this.showToastMessage("Please select members to remove", "error")
      return
    }
    // Remove members from the group
     this.groupMembers = this.groupMembers.filter((member) => !this.selectedMembersToRemove.includes(member.id))

    // Update member count
    // if (this.editingGroup) {
    //   const groupIndex = this.discountGroups.findIndex((g) => g.id === this.editingGroup!.id)
    //   if (groupIndex !== -1) {
    //     this.discountGroups[groupIndex].member_count -= this.selectedMembersToRemove.length
    //   }
    // }

    this.selectedMembersToRemove = []
    this.showToastMessage("Members removed successfully", "success")
  }






  confirmDeleteGroup(groupId: number, groupName: string): void {
    this.isManageMembersDialogOpen = false;
  Swal.fire({
    title: 'Confirm Delete',
    text: `Are you sure you want to delete "${groupName}"? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.handleDeleteGroup(groupId);
    }
  });

}



  toggleDropdown(event: Event, groupId: number): void {
    event.stopPropagation()
    const dropdown = document.getElementById(`dropdown-${groupId}`)
    if (dropdown) {
      dropdown.classList.toggle("diss-dropdown-show")
    }

    // Close other dropdowns
    document.querySelectorAll(".diss-dropdown-content").forEach((el) => {
      if (el.id !== `dropdown-${groupId}`) {
        el.classList.remove("diss-dropdown-show")
      }
    })
  }

  openExportDialog(): void {
    this.isExportDialogOpen = true
  }

  closeExportDialog(): void {
    this.isExportDialogOpen = false
    this.exportFormat = "csv"
    this.exportType = "all"
    this.selectedExportGroupId = ""
  }

  handleExport(): void {
    if (this.exportType === "single" && !this.selectedExportGroupId) {
      this.showToastMessage("Please select a group to export", "error")
      return
    }

    if (this.exportFormat === "csv") {
      this.exportToCSV()
    } else {
      this.exportToExcel()
    }

    this.closeExportDialog()
    this.showToastMessage(`Data exported successfully as ${this.exportFormat.toUpperCase()}`, "success")
  }

  exportToCSV(): void {
    const data = this.getExportData()
    const csvContent = this.convertToCSV(data)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const filename = this.getExportFilename("csv")
    this.downloadFile(blob, filename)
  }

  exportToExcel(): void {
    const data = this.getExportData()
    const worksheet = this.createWorksheet(data)
    const workbook = { Sheets: { "Group Members": worksheet }, SheetNames: ["Group Members"] }
    const excelBuffer = this.writeWorkbook(workbook)
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const filename = this.getExportFilename("xlsx")
    this.downloadFile(blob, filename)
  }

  getExportData(): any[] {
    if (this.exportType === "all") {
      // Export all groups with their members
      const allData: any[] = []
      this.discountGroups.forEach((group) => {
        // Mock members for each group - replace with actual API call
        const groupMembers = this.users.slice(0, group.member_count)
        groupMembers.forEach((member) => {
          allData.push({
            "Group Name": group.name,
            "Group Created Date": group.createdDate,
            "Member Name": member.name,
            "Member Email": member.email,
            "Member Phone": member.phone,
            "Member Status": member.isVerified ? "Verified" : "Unverified",
            "Member Created Date": member.createdDate,
          })
        })
      })
      return allData
    } else {
      // Export single group
      const selectedGroup = this.discountGroups.find((g) => g.id === Number.parseInt(this.selectedExportGroupId))
      if (!selectedGroup) return []

      // Mock members for the selected group - replace with actual API call
      const groupMembers = this.users.slice(0, selectedGroup.member_count)
      return groupMembers.map((member) => ({
        "Group Name": selectedGroup.name,
        "Group Created Date": selectedGroup.createdDate,
        "Member Name": member.name,
        "Member Email": member.email,
        "Member Phone": member.phone,
        "Member Status": member.isVerified ? "Verified" : "Unverified",
        "Member Created Date": member.createdDate,
      }))
    }
  }

  convertToCSV(data: any[]): string {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(",")
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes in CSV
          return typeof value === "string" && (value.includes(",") || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        })
        .join(","),
    )

    return [csvHeaders, ...csvRows].join("\n")
  }

  createWorksheet(data: any[]): any {
    if (data.length === 0) return {}

    const headers = Object.keys(data[0])
    const worksheet: any = {}

    // Add headers
    headers.forEach((header, colIndex) => {
      const cellAddress = this.getCellAddress(0, colIndex)
      worksheet[cellAddress] = { v: header, t: "s" }
    })

    // Add data rows
    data.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const cellAddress = this.getCellAddress(rowIndex + 1, colIndex)
        const value = row[header]
        worksheet[cellAddress] = {
          v: value,
          t: typeof value === "number" ? "n" : "s",
        }
      })
    })

    // Set worksheet range
    const range = `A1:${this.getCellAddress(data.length, headers.length - 1)}`
    worksheet["!ref"] = range

    return worksheet
  }

  getCellAddress(row: number, col: number): string {
    const colLetter = String.fromCharCode(65 + col) // A, B, C, etc.
    return `${colLetter}${row + 1}`
  }

  writeWorkbook(workbook: any): ArrayBuffer {
    // Simple XLSX writer implementation
    // In a real application, you would use a library like xlsx or exceljs
    const xmlContent = this.createXMLContent(workbook)
    const buffer = new ArrayBuffer(xmlContent.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < xmlContent.length; i++) {
      view[i] = xmlContent.charCodeAt(i) & 0xff
    }
    return buffer
  }

  createXMLContent(workbook: any): string {
    // Simplified XML structure for Excel file
    // In production, use a proper XLSX library
    const worksheet = workbook.Sheets["Group Members"]
    let xmlRows = ""

    if (worksheet["!ref"]) {
      const range = worksheet["!ref"].split(":")
      const startCell = range[0]
      const endCell = range[1]

      // Extract row and column counts (simplified)
      const endCol = endCell.charCodeAt(0) - 65
      const endRow = Number.parseInt(endCell.substring(1))

      for (let row = 1; row <= endRow; row++) {
        let xmlCells = ""
        for (let col = 0; col <= endCol; col++) {
          const cellAddress = this.getCellAddress(row - 1, col)
          const cell = worksheet[cellAddress]
          if (cell) {
            xmlCells += `<c r="${cellAddress}"><v>${cell.v}</v></c>`
          }
        }
        xmlRows += `<row r="${row}">${xmlCells}</row>`
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${xmlRows}</sheetData>
</worksheet>`
  }

  getExportFilename(extension: string): string {
    const timestamp = new Date().toISOString().split("T")[0]
    if (this.exportType === "all") {
      return `all-group-members-${timestamp}.${extension}`
    } else {
      const selectedGroup = this.discountGroups.find((g) => g.id === Number.parseInt(this.selectedExportGroupId))
      const groupName = selectedGroup ? selectedGroup.name.replace(/[^a-zA-Z0-9]/g, "-") : "group"
      return `${groupName}-members-${timestamp}.${extension}`
    }
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  exportSingleGroup(group: DiscountGroup): void {
    this.exportType = "single"
    this.selectedExportGroupId = group.id.toString()
    this.openExportDialog()
  }
}
