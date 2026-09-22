import * as jsonRepository from "./store-json";
import * as prismaRepository from "./store-prisma";

const backend = (process.env.A2_STORE_BACKEND || (process.env.DATABASE_URL ? "prisma" : "json")).toLowerCase();
const repository = backend === "prisma" ? prismaRepository : jsonRepository;

export const getStoreMeta = repository.getStoreMeta;
export const getStorefrontProducts = repository.getStorefrontProducts;
export const getStorefrontProduct = repository.getStorefrontProduct;
export const getAdminProducts = repository.getAdminProducts;
export const createProduct = repository.createProduct;
export const updateProduct = repository.updateProduct;
export const deleteProduct = repository.deleteProduct;
export const getOrders = repository.getOrders;
export const getOrderByNumber = repository.getOrderByNumber;
export const updateOrderStatus = repository.updateOrderStatus;
export const adjustInventory = repository.adjustInventory;
export const getInventory = repository.getInventory;
export const getDiscounts = repository.getDiscounts;
export const createDiscount = repository.createDiscount;
export const updateDiscount = repository.updateDiscount;
export const deleteDiscount = repository.deleteDiscount;
export const getCustomers = repository.getCustomers;
export const getSettings = repository.getSettings;
export const updateSettings = repository.updateSettings;
export const quoteCheckout = repository.quoteCheckout;
export const createOrder = repository.createOrder;
export const requestReturn = repository.requestReturn;
export const getDashboardMetrics = repository.getDashboardMetrics;
