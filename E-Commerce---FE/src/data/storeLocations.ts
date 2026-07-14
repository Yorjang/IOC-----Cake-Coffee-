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
};

export const storeLocations: StoreLocation[] = [
  {
    id: "q1",
    name: "Sweet Bean Quận 1",
    shortName: "Quận 1",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: "0909 888 777",
    hours: "07:00 - 22:00",
    distance: "1.8 km",
    delivery: "35-45 phút",
    status: "Đang mở cửa",
    highlight: "Gần bạn nhất",
    mapQuery: "Sweet Bean 123 Nguyen Hue Quan 1 Ho Chi Minh",
  },
  {
    id: "thao-dien",
    name: "Sweet Bean Thảo Điền",
    shortName: "Thảo Điền",
    address: "45 Xuân Thủy, Thảo Điền, TP. Thủ Đức",
    phone: "0912 444 555",
    hours: "07:30 - 21:30",
    distance: "5.6 km",
    delivery: "45-60 phút",
    status: "Đang mở cửa",
    highlight: "Nhiều bàn trống",
    mapQuery: "45 Xuan Thuy Thao Dien Thu Duc Ho Chi Minh",
  },
  {
    id: "phu-nhuan",
    name: "Sweet Bean Phú Nhuận",
    shortName: "Phú Nhuận",
    address: "88 Phan Xích Long, Phú Nhuận, TP.HCM",
    phone: "0933 222 111",
    hours: "08:00 - 22:00",
    distance: "3.2 km",
    delivery: "40-55 phút",
    status: "Đang mở cửa",
    highlight: "Còn nhiều bánh sinh nhật",
    mapQuery: "88 Phan Xich Long Phu Nhuan Ho Chi Minh",
  },
];
