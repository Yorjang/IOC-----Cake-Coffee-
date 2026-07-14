import { ArrowLeft } from "lucide-react";
import { VIEW_KEYS } from "../../config/appConfig";

const contentMap: Record<string, { title: string; content: React.ReactNode }> = {
  privacy: {
    title: "Chính sách bảo mật",
    content: (
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Chào mừng bạn đến với Sweet Bean Coffee. Chúng tôi tôn trọng và cam kết bảo mật thông tin cá nhân của bạn. Xin vui lòng đọc bản Chính sách bảo mật dưới đây để hiểu hơn những cam kết mà chúng tôi thực hiện, nhằm tôn trọng và bảo vệ quyền lợi của người truy cập.</p>
        
        <h3 className="text-lg font-bold text-foreground mt-8">1. Thu thập thông tin cá nhân</h3>
        <p>Chúng tôi thu thập thông tin cá nhân của bạn (bao gồm nhưng không giới hạn ở tên, số điện thoại, email, địa chỉ) khi bạn tự nguyện cung cấp qua các form đăng ký, đặt hàng, hoặc liên hệ. Các thông tin này sẽ được sử dụng để xử lý đơn hàng, liên hệ hỗ trợ, và cải thiện trải nghiệm mua sắm của bạn.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">2. Sử dụng thông tin cá nhân</h3>
        <p>Chúng tôi chỉ sử dụng thông tin thu thập được cho mục đích nội bộ và có thể sử dụng thông tin đó để liên hệ trực tiếp với bạn dưới các hình thức như: gửi thư ngỏ, đơn đặt hàng, thư cảm ơn, thông tin về kỹ thuật và bảo mật...</p>

        <h3 className="text-lg font-bold text-foreground mt-8">3. Chia sẻ thông tin cá nhân</h3>
        <p>Ngoại trừ các trường hợp về Sử dụng thông tin cá nhân như đã nêu trong chính sách này, chúng tôi cam kết sẽ không tiết lộ thông tin cá nhân bạn ra ngoài. Chúng tôi có thể tiết lộ thông tin cá nhân trong các trường hợp thật sự cần thiết như pháp luật yêu cầu hoặc bảo vệ quyền lợi chính đáng của mình trước pháp luật.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">4. Quyền lợi của khách hàng</h3>
        <p>Bạn có quyền yêu cầu truy cập, điều chỉnh, hoặc xóa thông tin cá nhân của mình bằng cách liên hệ trực tiếp với đội ngũ Chăm sóc khách hàng của chúng tôi.</p>
      </div>
    ),
  },
  terms: {
    title: "Điều khoản dịch vụ",
    content: (
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Vui lòng đọc kỹ các Điều khoản dịch vụ này trước khi sử dụng website và dịch vụ của Sweet Bean Coffee. Bằng việc truy cập vào website này, bạn mặc nhiên đồng ý với các điều khoản dưới đây.</p>
        
        <h3 className="text-lg font-bold text-foreground mt-8">1. Quyền và Trách nhiệm của Người dùng</h3>
        <p>Người dùng cam kết cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản hoặc đặt hàng. Bạn chịu trách nhiệm hoàn toàn đối với mọi hoạt động dưới tài khoản đăng nhập của mình và có nghĩa vụ bảo mật mật khẩu.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">2. Điều khoản Giao dịch</h3>
        <p>Mọi đơn hàng được thực hiện qua website đều phải tuân thủ quy định về giá cả, phí vận chuyển và thời gian giao hàng được thông báo trên hệ thống tại thời điểm đặt hàng. Chúng tôi có quyền từ chối hoặc hủy đơn hàng vì các lý do chính đáng như lỗi hệ thống hiển thị sai giá, hoặc khách hàng cung cấp địa chỉ không rõ ràng.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">3. Quyền sở hữu trí tuệ</h3>
        <p>Toàn bộ nội dung của trang web (bao gồm văn bản, hình ảnh, video, thiết kế, logo) đều thuộc quyền sở hữu của Sweet Bean Coffee. Nghiêm cấm sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự đồng ý bằng văn bản từ phía chúng tôi.</p>

        <h3 className="text-lg font-bold text-foreground mt-8">4. Thay đổi điều khoản</h3>
        <p>Chúng tôi có thể sửa đổi Điều khoản dịch vụ này vào bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải lên website. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận những thay đổi đó.</p>
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
