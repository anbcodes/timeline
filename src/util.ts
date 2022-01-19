export const stopPropagation = (e: Event) => e.stopPropagation();
export const formatYear = (year: number) =>
  year >= 0 ? `${year} AD` : `${Math.abs(year)} BC`;
