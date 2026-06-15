/**
 * Express application factory.
 *
 * Builds and wires the app without binding a port, so the same instance can be
 * driven by the HTTP server (src/index.ts) and, later, by Supertest (0.9).
 *
 * Middleware order is deliberate:
 *   1. request logger + request id   (so everything downstream is traced)
 *   2. security headers (helmet)
 *   3. cors                           (handles preflight before the limiter)
 *   4. global rate limiter            (skips health probes)
 *   5. body parsers
 *   6. routes (liveness, then versioned API)
 *   7. 404 handler
 *   8. global error handler          (must be last)
 */
import express from 'express';
import type { Application } from 'express';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middleware/request-logger.js';
import { securityHeaders, corsMiddleware } from './middleware/security.js';
import { globalRateLimiter } from './middleware/rate-limit.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoryRouter, categoryAdminRouter } from './modules/category/category.routes.js';
import { collectionRouter, collectionAdminRouter } from './modules/collection/collection.routes.js';
import { productRouter, productAdminRouter } from './modules/product/product.routes.js';
import { inventoryAdminRouter } from './modules/inventory/inventory.routes.js';
import { promotionAdminRouter } from './modules/promotion/promotion.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { wishlistRouter } from './modules/wishlist/wishlist.routes.js';
import { checkoutRouter, orderAdminRouter, ordersRouter } from './modules/order/order.routes.js';
import { webhookRouter } from './modules/payment/payment.routes.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp(): Application {
  const app = express();

  // Hardening / platform.
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // Observability — first, so even rejected/limited requests are traced.
  app.use(requestLogger);

  // Security headers + CORS allow-list (CORS handles & ends OPTIONS preflight).
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Per-IP rate limiting (before body parsing; skips health probes).
  app.use(globalRateLimiter);

  // Body parsing (bounded to mitigate large-payload abuse). Stash the raw buffer
  // so webhook routes can verify HMAC signatures over the exact bytes.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Cookie parsing (refresh-token + CSRF cookies; 0.7), consumed by the auth routes.
  app.use(cookieParser());

  // Liveness probe — minimal, unversioned, dependency-free (for Cloud Run / LB).
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Versioned API surface.
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/categories', categoryRouter);
  app.use('/api/v1/collections', collectionRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/wishlist', wishlistRouter);
  app.use('/api/v1/checkout', checkoutRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/admin/categories', categoryAdminRouter);
  app.use('/api/v1/admin/collections', collectionAdminRouter);
  app.use('/api/v1/admin/products', productAdminRouter);
  app.use('/api/v1/admin/inventory', inventoryAdminRouter);
  app.use('/api/v1/admin/promotions', promotionAdminRouter);
  app.use('/api/v1/admin/orders', orderAdminRouter);

  // Fall-through 404, then the single global error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
