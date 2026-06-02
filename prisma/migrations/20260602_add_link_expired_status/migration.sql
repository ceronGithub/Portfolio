-- Migration: Add LINK_EXPIRED to OrderStatus enum
ALTER TYPE "OrderStatus" ADD VALUE 'LINK_EXPIRED';
