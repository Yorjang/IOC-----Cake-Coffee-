export type StoreLocation = {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  hours: string;
  distance: string;
  delivery: string;
  status: string;
  highlight: string;
  mapQuery: string;
  isOpenNow: boolean;
  todayOpeningHour?: {
    openingTime: string | null;
    closingTime: string | null;
    isClosed: boolean;
  } | null;
};

