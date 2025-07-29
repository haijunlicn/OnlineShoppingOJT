import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuditLog } from '@app/core/models/audit-log';
import { User } from '@app/core/models/User';

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
            const v = value as { old: any; new: any };

            if (key === 'options' && Array.isArray(v.new)) {
              const newOptions = v.new.map(o => `${o.optionName}: ${o.valueName}`).join(', ');
              details.push(`${key}: "${v.old}" → "${newOptions}"`);
            } else if (key === 'imgPath') {
              details.push(
                `${key}: <span style="display: inline-block; margin-right: 8px;"><img src="${v.old}" width="60"></span> → <span style="display: inline-block;"><img src="${v.new}" width="60"></span>`
              );
            } else {
              details.push(`${key}: "${v.old}" → "${v.new}"`);
            }
          } else {
            details.push(`${key}: ${JSON.stringify(value)}`);
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

    // ✅ Prepend synthetic CREATE log
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
