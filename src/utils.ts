export const DEFAULT_MONTHS_BALANCE_DELTA = {
  january: 0,
  february: 0,
  march: 0,
  april: 0,
  may: 0,
  june: 0,
  july: 0,
  august: 0,
  september: 0,
  october: 0,
  november: 0,
  december: 0,
};

export const getMonthByIndex = (index: number): MonthKeys => {
  switch (index) {
    case 0:
      return "january";
    case 1:
      return "february";
    case 2:
      return "march";
    case 3:
      return "april";
    case 4:
      return "may";
    case 5:
      return "june";
    case 6:
      return "july";
    case 7:
      return "august";
    case 8:
      return "september";
    case 9:
      return "october";
    case 10:
      return "november";
    case 11:
    default:
      // default case should never happen
      return "december";
  }
};

export type MonthKeys =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";
