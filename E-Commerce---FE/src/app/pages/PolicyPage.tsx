import { ArrowLeft } from "lucide-react";
import { VIEW_KEYS } from "../../config/appConfig";

const contentMap: Record<string, { title: string; content: React.ReactNode }> = {
  privacy: {
    title: "Chính sách bảo mật",
    content: (
      <div className="space-y-6 text-muted-foreground leading-relaxed text-sm md:text-base">
        <p>Chào mừng bạn đến với <strong>Sweet Bean Coffee</strong>. Chúng tôi hiểu rằng quyền riêng tư và bảo mật thông tin cá nhân là vô cùng quan trọng đối với khách hàng. Chính sách bảo mật này mô tả cách thức chúng tôi thu thập, sử dụng, bảo vệ và chia sẻ thông tin cá nhân của bạn khi bạn sử dụng website và dịch vụ đặt hàng của chúng tôi.</p>
        
        <h3 className="text-lg font-bold text-foreground mt-8">1. Mục đích và phạm vi thu thập thông tin</h3>
        <p>Để việc xử lý đơn hàng và giao nhận (đồ ăn, thức uống) diễn ra nhanh chóng, chúng tôi có thể yêu cầu bạn cung cấp các thông tin cá nhân bao gồm: <strong>Họ và tên, Số điện thoại, Địa chỉ giao hàng, và Địa chỉ Email</strong>. Mọi thông tin khai báo phải đảm bảo tính chính xác và hợp pháp, Sweet Bean Coffee không chịu mọi trách nhiệm liên quan đến pháp luật của thông tin khai báo.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">2. Phạm vi sử dụng thông tin</h3>
        <p>Chúng tôi thu thập và sử dụng thông tin cá nhân của bạn với mục đích phù hợp và hoàn toàn tuân thủ nội dung của Chính sách bảo mật này. Cụ thể, thông tin được sử dụng để:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Xác nhận đơn đặt hàng, chuẩn bị món và thực hiện việc giao hàng (thông qua đối tác vận chuyển).</li>
          <li>Cung cấp thông tin liên quan đến sản phẩm, chương trình khuyến mãi, voucher giảm giá (nếu bạn đăng ký nhận thông báo).</li>
          <li>Hỗ trợ khách hàng, giải quyết khiếu nại, đổi trả.</li>
          <li>Ngăn ngừa các hoạt động phá hủy tài khoản người dùng hoặc các hoạt động giả mạo khách hàng.</li>
        </ul>

        <h3 className="text-lg font-bold text-foreground mt-8">3. Thời gian lưu trữ thông tin</h3>
        <p>Dữ liệu cá nhân của Thành viên sẽ được lưu trữ bảo mật trên máy chủ của hệ thống cho đến khi có yêu cầu hủy bỏ hoặc tự Thành viên đăng nhập và thực hiện hủy bỏ. Trong mọi trường hợp khác, thông tin sẽ được lưu giữ theo quy định của pháp luật.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">4. Những người hoặc tổ chức có thể được tiếp cận thông tin</h3>
        <p>Chúng tôi cam kết không bán, trao đổi hay chia sẻ thông tin của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Thông tin chỉ được chia sẻ trong các trường hợp sau:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Đối tác vận chuyển:</strong> Cung cấp Tên, Số điện thoại và Địa chỉ để shipper thực hiện giao hàng tận nơi.</li>
          <li><strong>Cổng thanh toán:</strong> Phục vụ cho việc xác thực các giao dịch điện tử.</li>
          <li><strong>Cơ quan pháp luật:</strong> Khi có yêu cầu từ cơ quan chức năng hoặc khi chúng tôi tin rằng việc làm đó là cần thiết để bảo vệ quyền lợi chính đáng của mình.</li>
        </ul>

        <h3 className="text-lg font-bold text-foreground mt-8">5. Cam kết bảo mật thông tin</h3>
        <p>Thông tin cá nhân của thành viên được cam kết bảo mật tuyệt đối theo chính sách bảo vệ thông tin cá nhân. Chúng tôi sử dụng phần mềm mã hóa kết nối (SSL) để bảo vệ dữ liệu trong quá trình truyền tải. Tuy nhiên, không có dữ liệu nào truyền trên Internet có thể được bảo mật 100%. Do vậy, chúng tôi không thể đưa ra một cam kết chắc chắn rằng thông tin bạn cung cấp sẽ được bảo mật một cách tuyệt đối an toàn.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">6. Quyền lợi và liên hệ</h3>
        <p>Bạn có quyền tự kiểm tra, cập nhật, điều chỉnh hoặc hủy bỏ thông tin cá nhân của mình bằng cách đăng nhập vào tài khoản và chỉnh sửa hoặc yêu cầu ban quản trị thực hiện việc này. Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ qua hotline hoặc email hỗ trợ của Sweet Bean Coffee.</p>
      </div>
    ),
  },
  terms: {
    title: "Điều khoản dịch vụ",
    content: (
      <div className="space-y-6 text-muted-foreground leading-relaxed text-sm md:text-base">
        <p>Vui lòng đọc kỹ các Điều khoản dịch vụ này trước khi tiến hành đặt hàng tại website của <strong>Sweet Bean Coffee</strong>. Bằng việc truy cập, đăng ký tài khoản và sử dụng dịch vụ đặt món, bạn được xem là đã đồng ý với toàn bộ các điều khoản được nêu dưới đây.</p>
        
        <h3 className="text-lg font-bold text-foreground mt-8">1. Quy định về Tài khoản và Đặt hàng</h3>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Người dùng cần cung cấp thông tin liên lạc chính xác để quá trình xác nhận và giao nhận đồ ăn thức uống diễn ra suôn sẻ.</li>
          <li>Bạn có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Cửa hàng không chịu trách nhiệm cho các thiệt hại phát sinh do sự bất cẩn làm lộ mật khẩu.</li>
          <li>Sweet Bean Coffee có quyền từ chối cung cấp dịch vụ, đóng tài khoản, hoặc hủy đơn hàng theo quyết định của mình nếu phát hiện hành vi gian lận, phá hoại hoặc vi phạm pháp luật.</li>
        </ul>

        <h3 className="text-lg font-bold text-foreground mt-8">2. Giá cả và Sản phẩm</h3>
        <p>Tất cả hình ảnh trên website mang tính chất minh họa. Sản phẩm thực tế có thể có đôi chút khác biệt về cách bài trí. Mức giá niêm yết của các loại bánh, đồ uống và combo có thể thay đổi tùy theo thời điểm mà không cần báo trước. Tuy nhiên, mức giá bạn thanh toán sẽ là mức giá hiển thị tại thời điểm bạn hoàn tất quá trình đặt hàng.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">3. Giao nhận và Thanh toán</h3>
        <p>Chúng tôi hiện cung cấp các phương thức thanh toán bao gồm: Tiền mặt khi nhận hàng (COD), Chuyển khoản ngân hàng và Ví điện tử. Thời gian giao hàng dự kiến sẽ phụ thuộc vào khoảng cách từ chi nhánh gần nhất tới địa chỉ của bạn và tình trạng giao thông. Xin lưu ý rằng đối với các sản phẩm F&B (bánh kem, đồ uống đá xay), người nhận cần sắp xếp nhận hàng kịp thời để đảm bảo chất lượng ngon nhất.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">4. Chính sách Đổi trả và Hoàn tiền</h3>
        <p>Vì đặc thù của sản phẩm là thực phẩm và đồ uống chế biến sẵn dùng ngay, chúng tôi <strong>không áp dụng chính sách đổi trả</strong> sau khi khách hàng đã kiểm tra và nhận hàng thành công. Chúng tôi chỉ giải quyết hoàn tiền hoặc đổi món mới trong các trường hợp lỗi từ phía cửa hàng (giao sai món, sản phẩm bị hỏng, đổ vỡ trong quá trình vận chuyển) nếu được phản hồi ngay tại thời điểm nhận hàng.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">5. Quyền sở hữu trí tuệ</h3>
        <p>Mọi nội dung, hình ảnh sản phẩm, logo, và thiết kế giao diện trên website đều thuộc bản quyền của Sweet Bean Coffee. Việc sao chép, sử dụng hoặc tái bản với mục đích thương mại mà chưa có sự đồng ý bằng văn bản là hành vi vi phạm pháp luật.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">6. Thay đổi điều khoản</h3>
        <p>Cửa hàng có quyền điều chỉnh, thay đổi nội dung của Điều khoản dịch vụ này bất cứ lúc nào để phù hợp với hoạt động kinh doanh. Những thay đổi sẽ được cập nhật công khai trên website và có hiệu lực ngay lập tức.</p>
      </div>
    ),
  },
};

export function PolicyPage({ type, setView }: { type: "privacy" | "terms"; setView: (view: string) => void }) {
  const policy = contentMap[type] || contentMap.privacy;

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl animate-fade-in min-h-[calc(100vh-300px)]">
      <button 
        onClick={() => setView(VIEW_KEYS.HOME)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Quay lại Trang chủ
      </button>

      <div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
          {policy.title}
        </h1>
        <div className="w-20 h-1 bg-primary mb-8 rounded-full"></div>
        
        {policy.content}
      </div>
    </div>
  );
}
