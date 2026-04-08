import { Link } from "react-router-dom";
import { BookOpen, Facebook, Globe, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

const footerGroups = [
  {
    title: "Khám phá",
    links: [
      { label: "Giới thiệu", to: "/" },
      { label: "Khóa học", to: "/learn" },
      { label: "Hồ sơ học tập", to: "/profile" },
      { label: "Đăng nhập", to: "/login" },
    ],
  },
  {
    title: "Chương trình",
    links: [
      { label: "Tiếng Anh giao tiếp", to: "/learn" },
      { label: "Luyện từ vựng mỗi ngày", to: "/learn" },
      { label: "Bài học theo chủ đề", to: "/learn" },
      { label: "Học qua nối từ", to: "/learn" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Câu hỏi thường gặp", to: "/" },
      { label: "Chính sách bảo mật", to: "/" },
      { label: "Điều khoản sử dụng", to: "/" },
      { label: "Liên hệ tư vấn", to: "/" },
    ],
  },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "YouTube", href: "#", icon: Youtube },
];

const contactItems = [
  { icon: Mail, label: "hello@lionlearning.vn" },
  { icon: Phone, label: "(+84) 1900 6868" },
  { icon: MapPin, label: "Thủ Đức, TP. Hồ Chí Minh" },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(254,77,1,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-sm">
          <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_1.8fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-sm text-primary-200">
                <BookOpen className="h-4 w-4" />
                Nền tảng học ngôn ngữ hiện đại
              </div>

              <div className="space-y-4">
                <Link to="/" className="text-4xl font-black tracking-tighter text-white transition-all group-hover:tracking-normal">
                    L<span className="text-primary-500 italic">i</span>on
                </Link>
                <p className="max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                  Học ngoại ngữ theo lộ trình rõ ràng, thực hành mỗi ngày và theo dõi tiến bộ của bạn trong một không
                  gian học tập gọn gàng, truyền cảm hứng.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">Bắt đầu hôm nay</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Mở bài học đầu tiên, xây thói quen 15 phút mỗi ngày và biến việc học thành nhịp sống tự nhiên.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/learning"
                    className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-500"
                  >
                    Bắt đầu học
                  </Link>
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-primary-400/50 hover:text-primary-200"
                  >
                    Xem lộ trình
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Globe className="h-4 w-4 text-primary-300" />
                  Kết nối cùng Lion
                </div>
                <div className="mt-5 space-y-4">
                  {contactItems.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-0.5 rounded-lg bg-white/5 p-2 text-primary-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="leading-6">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-all duration-200 hover:-translate-y-1 hover:border-primary-400/60 hover:bg-primary-500/10 hover:text-primary-200"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>

              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">{group.title}</h3>
                  <ul className="mt-5 space-y-3 text-sm text-slate-300">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className="inline-flex transition-colors duration-200 hover:text-primary-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-4 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-3 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
              <p>&copy; {new Date().getFullYear()} Lion. Đồng hành cùng bạn trên hành trình chinh phục ngoại ngữ.</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/" className="transition-colors hover:text-primary-200">
                  Điều khoản
                </Link>
                <Link to="/" className="transition-colors hover:text-primary-200">
                  Bảo mật
                </Link>
                <Link to="/" className="transition-colors hover:text-primary-200">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
