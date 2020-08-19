export const url =
  "https://www.binance.com/exchange-api/v1/public/asset-service/product/get-products";

export type ProductDataType = {
  b: string; //	base asset
  q: string; //	quote asset
  o: number; //	open price
  h: number; //	high price
  l: number; //	low price
  c: number; //	latest price
  pm: string; //	parent market
  pn: string; //	category of the parent market
};

export default (): Promise<ProductDataType[]> => {
  return fetch(url)
    .then((response) => response.json())
    .then(({ data }) => data);
};
