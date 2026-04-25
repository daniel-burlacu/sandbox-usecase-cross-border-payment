import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { paths } from '@/config/paths';
import { ProtectedRoute } from '@/lib/auth';

import { AppRoot, AppRootErrorBoundary } from './routes/root';

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.auth.login.path,
      lazy: async () => {
        const { LoginRoute } = await import('./routes/auth/login');
        return { Component: LoginRoute };
      },
    },
    {
      element: (
        <ProtectedRoute>
          <AppRoot />
        </ProtectedRoute>
      ),
      ErrorBoundary: AppRootErrorBoundary,
      children: [
        {
          index: true, // ← marks this as the default child route at `/`
          lazy: async () => {
            const { DashboardRoute } = await import('./routes/dashboard');
            return { Component: DashboardRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.transactions.path,
          lazy: async () => {
            const { TransactionsRoute } = await import('./routes/transactions/transactions');
            return { Component: TransactionsRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.transaction.path, // 'transaction/:payeeIdentity'
          lazy: async () => {
            const { TransactionRoute } = await import('./routes/transactions/transaction');
            return { Component: TransactionRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.transactionsRoadmap.path,
          lazy: async () => {
            const { TransactionRoadmapRoute } = await import('./routes/transactions/transaction-roadmap');
            return { Component: TransactionRoadmapRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.transactionsInitiated.path,
          lazy: async () => {
            const { TransactionsInitiatedRoute } = await import('./routes/transactions/transactions-initiated');
            return { Component: TransactionsInitiatedRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.transactionInitiated.path, // 'transactionInitiated/:payeeIdentity'
          lazy: async () => {
            const { TransactionInitiatedRoute } = await import('./routes/transactions/transaction-initiated');
            return { Component: TransactionInitiatedRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.TransactionsBatchRoadmapView.path,
          lazy: async () => {
            const { TransactionsBatchRoadmapViewRoute } = await import('./routes/transactions/transactions-batch-roadmap');
            return { Component: TransactionsBatchRoadmapViewRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
        {
          path: paths.app.batch.path,
          lazy: async () => {
            const { BatchRoute } = await import('./routes/batch');
            return { Component: BatchRoute };
          },
          ErrorBoundary: AppRootErrorBoundary,
        },
      ]
    },

    {
      path: '*',
      lazy: async () => {
        const { NotFoundRoute } = await import('./routes/not-found');
        return { Component: NotFoundRoute };
      },
      ErrorBoundary: AppRootErrorBoundary,
    },

  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const [router] = useState(() => createAppRouter(queryClient));

  return <RouterProvider router={router} />;
};
