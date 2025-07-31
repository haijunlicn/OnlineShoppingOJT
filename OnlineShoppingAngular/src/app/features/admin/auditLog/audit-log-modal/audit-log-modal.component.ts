// import { Component, EventEmitter, Input, Output } from '@angular/core';
// import { AuditLog } from '@app/core/models/audit-log';
// import { User } from '@app/core/models/User';

// const fieldLabels: Record<string, string> = {
//   delFg: 'Status',
//   imgPath: 'Image',
//   price: 'Price',
//   options: 'Options',
//   stock: 'Stock',
//   // Add more as needed
// };

// @Component({
//   selector: 'app-audit-log-modal',
//   standalone: false,
//   templateUrl: './audit-log-modal.component.html',
//   styleUrl: './audit-log-modal.component.css'
// })
// export class AuditLogModalComponent {
//   private _rawLogs: AuditLog[] = [];

//   parsedLogs: {
//     action: string;
//     username: string;
//     createdDate: string;
//     description: string;
//     details: string[];
//   }[] = [];

//   @Input() createdMeta: { createdBy?: User; createdDate?: string } | null = null;

//   @Input() set logs(value: AuditLog[]) {
//     this._rawLogs = value || [];

//     this.parsedLogs = this._rawLogs.map(log => {
//       const details: string[] = [];

//       try {
//         const data = JSON.parse(log.changedData || '{}');
//         const changes = data.changes || data;

//         for (const [key, value] of Object.entries(changes)) {
//           if (
//             typeof value === 'object' &&
//             value !== null &&
//             'old' in value &&
//             'new' in value
//           ) {
//             const { old, new: newVal } = value as { old: any; new: any };

//             const formatValue = (val: any) => {
//               if (val === null || val === undefined || val === '') return 'None';
//               if (typeof val === 'object') return JSON.stringify(val);
//               return String(val);
//             };

//             // Skip identical values unless needed for audit
//             if (formatValue(old) === formatValue(newVal)) continue;

//             if (key === 'options') {
//               // Handle array case (preferred format)
//               if (Array.isArray(newVal)) {
//                 const newOptions = newVal.map(o => `${o.optionName}: ${o.valueName}`).join(', ');
//                 const oldOptions = Array.isArray(old)
//                   ? old.map(o => `${o.optionName}: ${o.valueName}`).join(', ')
//                   : formatValue(old);

//                 details.push(`${key}: "${oldOptions}" → "${newOptions}"`);
//               } else {
//                 // Fallback: plain string changes

//                 // Custom labels for some technical fields
//                 if (key === 'delFg') {
//                   const formatDelFg = (val: any) =>
//                     val === 0 || val === '0' ? 'Deleted' : val === 1 || val === '1' ? 'Active' : String(val);

//                   details.push(`Status: "${formatDelFg(old)}" → "${formatDelFg(newVal)}"`);
//                 } else {
//                   details.push(`${key}: "${formatValue(old)}" → "${formatValue(newVal)}"`);
//                 }


//                 //  details.push(`${key}: "${formatValue(old)}" → "${formatValue(newVal)}"`);
//               }
//             } else if (key === 'imgPath') {
//               const oldImg = old ? `<img src="${old}" width="60">` : 'None';
//               const newImg = newVal ? `<img src="${newVal}" width="60">` : 'None';
//               details.push(
//                 `${key}: <span style="margin-right:8px;">${oldImg}</span> → <span>${newImg}</span>`
//               );
//             } else {
//               details.push(`${key}: "${formatValue(old)}" → "${formatValue(newVal)}"`);
//             }
//           } else {
//             // Non-diff-style data (e.g., {"note": "some comment"})
//             details.push(`${key}: ${JSON.stringify(value)}`);
//           }
//         }
//       } catch {
//         details.push('Unable to parse details.');
//       }

//       return {
//         action: log.action,
//         username: log.username,
//         createdDate: log.createdDate,
//         description: log.description || '',
//         details,
//       };
//     });

//     // Optional CREATE log
//     if (this.createdMeta?.createdBy && this.createdMeta?.createdDate) {
//       this.parsedLogs.unshift({
//         action: 'CREATE',
//         username: this.createdMeta.createdBy.name,
//         createdDate: this.createdMeta.createdDate,
//         description: 'Initial creation',
//         details: [],
//       });
//     }
//   }

//   @Output() close = new EventEmitter<void>();
// }


import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuditLog } from '@app/core/models/audit-log';
import { User } from '@app/core/models/User';

const fieldLabels: Record<string, string> = {
  delFg: 'Status',
  imgPath: 'Image',
  price: 'Price',
  options: 'Options',
  stock: 'Stock',
  // Add more field mappings here
};

@Component({
  selector: 'app-audit-log-modal',
  standalone: false,
  templateUrl: './audit-log-modal.component.html',
  styleUrl: './audit-log-modal.component.css'
})

export class AuditLogModalComponent {
  private _rawLogs: AuditLog[] = [];

  parsedLogs: {
    action: string;
    username: string;
    createdDate: string;
    description: string;
    details: string[];
  }[] = [];

  @Input() createdMeta: { createdBy?: User; createdDate?: string } | null = null;

  @Input() set logs(value: AuditLog[]) {
    this._rawLogs = value || [];

    this.parsedLogs = this._rawLogs.map(log => {
      const details: string[] = [];

      try {
        const data = JSON.parse(log.changedData || '{}');
        const changes = data.changes || data;

        for (const [key, value] of Object.entries(changes)) {
          if (
            typeof value === 'object' &&
            value !== null &&
            'old' in value &&
            'new' in value
          ) {
            const { old, new: newVal } = value as { old: any; new: any };

            const formatValue = (val: any): string => {
              if (val === null || val === undefined || val === '') return 'None';
              if (typeof val === 'object') return JSON.stringify(val);
              return String(val);
            };

            const label = fieldLabels[key] || key;

            if (formatValue(old) === formatValue(newVal)) continue;

            if (key === 'delFg') {
              const formatDelFg = (val: any) =>
                val === 0 || val === '0' ? 'Deleted' :
                val === 1 || val === '1' ? 'Active' : String(val);
              details.push(`${label}: "${formatDelFg(old)}" → "${formatDelFg(newVal)}"`);
            } else if (key === 'imgPath') {
              const oldImg = old ? `<img src="${old}" width="60">` : 'None';
              const newImg = newVal ? `<img src="${newVal}" width="60">` : 'None';
              details.push(`${label}: <span style="margin-right:8px;">${oldImg}</span> → <span>${newImg}</span>`);
            } else if (key === 'options') {
              const formatOptions = (opts: any) =>
                Array.isArray(opts)
                  ? opts.map(o => `${o.optionName}: ${o.valueName}`).join(', ')
                  : formatValue(opts);
              details.push(`${label}: "${formatOptions(old)}" → "${formatOptions(newVal)}"`);
            } else {
              details.push(`${label}: "${formatValue(old)}" → "${formatValue(newVal)}"`);
            }
          } else {
            const label = fieldLabels[key] || key;
            details.push(`${label}: ${JSON.stringify(value)}`);
          }
        }
      } catch {
        details.push('Unable to parse details.');
      }

      return {
        action: log.action,
        username: log.username,
        createdDate: log.createdDate,
        description: log.description || '',
        details,
      };
    });

    // Prepend CREATE entry if present
    if (this.createdMeta?.createdBy && this.createdMeta?.createdDate) {
      this.parsedLogs.unshift({
        action: 'CREATE',
        username: this.createdMeta.createdBy.name,
        createdDate: this.createdMeta.createdDate,
        description: 'Initial creation',
        details: [],
      });
    }
  }

  @Output() close = new EventEmitter<void>();
}
