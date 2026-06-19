import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'ask',
    pathMatch: 'full'
  },
  {
    path: 'ask',
    loadComponent: () =>
      import('./pages/ask/ask.component').then(m => m.AskComponent)
  },
  {
    path: 'browse',
    loadComponent: () =>
      import('./pages/browse/browse.component').then(m => m.BrowseComponent)
  },
  {
    path: 'graph',
    loadComponent: () =>
      import('./pages/graph/graph.component').then(m => m.GraphComponent)
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'copilot',
    loadComponent: () =>
      import('./pages/copilot/copilot.component').then(m => m.CopilotComponent)
  },
  {
    path: '**',
    redirectTo: 'ask'
  }
];
