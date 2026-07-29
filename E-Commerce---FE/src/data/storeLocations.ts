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
};export const storeLocations: StoreLocation[] = [
  {
    id: "33255cc5-ac61-42e4-8fbb-48b80e32321d",
    name: "Sweet Bean Mỹ Đình",
    shortName: "Mỹ Đình",
    address: "36 Lê Đức Thọ, Phường Mỹ Đình 2, Quận Nam Từ Liêm, Hà Nội",
    phone: "0912345604",
    hours: "07:00 - 22:00",
    distance: "1.8 km",
    delivery: "35-45 phút",
    status: "Đang mở cửa",
    highlight: "Gần bạn nhất",
    mapQuery: "36 Le Duc Tho, My Dinh, Ha Noi",
    isOpenNow: true,
  },
  {
    id: "2091d087-3cc6-4656-b116-c98b87fa4367",
    name: "Sweet Bean Nam Định Center",
    shortName: "Nam Định",
    address: "Trần Hưng Đạo, Thành phố Nam Định",
    phone: "0912345683",
    hours: "06:30 - 22:30",
    distance: "3.2 km",
    delivery: "40-50 phút",
    status: "Đang mở cửa",
    highlight: "Không gian rộng",
    mapQuery: "Tran Hung Dao, Nam Dinh",
    isOpenNow: true,
  },
  {
    id: "36b17393-d5fe-42c6-b00a-1ebbeef9508d",
    name: "Sweet Bean Ninh Bình - Ga",
    shortName: "Ninh Bình",
    address: "147 Nguyễn Huệ, Phường Hoa Lư, Ninh Bình",
    phone: "0912345678",
    hours: "07:30 - 22:00",
    distance: "5.5 km",
    delivery: "45-60 phút",
    status: "Sắp đóng cửa",
    highlight: "View đẹp",
    mapQuery: "147 Nguyen Hue, Ninh Binh",
    isOpenNow: true,
  }
];
