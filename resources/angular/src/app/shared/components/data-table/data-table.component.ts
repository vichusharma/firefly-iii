// src/app/shared/components/data-table/data-table.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';

export interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="dataSource" matSort>
        <ng-container *ngFor="let column of columns" [matColumnDef]="column.id">
          <th mat-header-cell *matHeaderCellDef [mat-sort-header]="column.sortable ? column.id : ''">
            {{ column.label }}
          </th>
          <td mat-cell *matCellDef="let row">{{ row[column.id] }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      <mat-paginator
        [length]="total"
        [pageSize]="pageSize"
        [pageSizeOptions]="[5, 10, 25]"
      ></mat-paginator>
    </div>
  `,
  styles: [`table { width: 100%; } th { font-weight: 500; }`],
})
export class DataTableComponent implements OnInit {
  @Input() columns: TableColumn[] = [];
  @Input() dataSource: any[] = [];
  @Input() total = 0;
  @Input() pageSize = 10;

  displayedColumns: string[] = [];

  ngOnInit(): void {
    this.displayedColumns = this.columns.map((c) => c.id);
  }
}
