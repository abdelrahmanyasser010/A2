export const formatPrice = (value: number) => `${new Intl.NumberFormat("en-EG").format(Math.round(value))} EGP`;
