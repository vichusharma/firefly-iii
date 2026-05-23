// src/app/features/accounts/account-detail/account-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="account-detail">
      <h2>Account Detail: {{ accountId }}</h2>
    </div>
  `,
  styles: [
    `
      .account-detail {
        padding: 2rem;
      }
    `,
  ],
})
export class AccountDetailComponent implements OnInit {
  accountId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
  }
}
