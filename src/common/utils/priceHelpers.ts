import type { OfferPriceDto } from "../types";

export function getFormatted(price: OfferPriceDto) : string {
    const formattedPrice = price.currency_symbol_position === 'before' ? 
        `${price.currency_symbol}${price.amount}` : 
        `${price.amount}${price.currency_symbol}`;
    return formattedPrice;
}        