import { useEffect, useState } from "react";
import heroImg from "/hero-illustration/hero-image.jpg";

export default function HomePage() {
  const [, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/public/health");
        if (response.ok) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch (error) {
        setApiStatus("offline");
      }
    };
    testApi();
  }, []);

  return (
    <>
      <div className="min-h-[70vh] flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-4 py-16 gap-8">
        {/* Left: Text */}
        <div className="flex-1 flex flex-col items-start justify-center text-left space-y-6 order-1 md:order-none">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Học ngoại ngữ <br />
            <span className="text-primary-600">để sống</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-lg">
            Những mẫu câu hữu ích trong cuộc sống hàng ngày. Được dạy với những video clip của người bản ngữ thực sự.
          </p>
          <div className="flex gap-4 mt-2">
            <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base rounded-lg shadow-md transition-all duration-200">
              Bắt đầu học
            </button>
            <button className="px-8 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-base rounded-lg transition-all duration-200">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
        {/* Right: Illustration */}
        <div className="flex-1 flex items-center justify-center mb-8 md:mb-0 order-2 md:order-none">
          <img
            src={heroImg}
            alt="Hero illustration"
            className="w-full max-w-md rounded-2xl shadow-lg object-contain"
          />
        </div>
      </div>
      {/* Features Section */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-2">
            Tại sao nên sử dụng{" "}
            <span className="text-primary-600">Lion</span>?
          </h2>
          <div className="w-24 h-2 bg-primary-600 mx-auto mb-8 rounded-full opacity-30"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center shadow-sm">
              <svg
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4"
              >
                <path
                  d="M24 8c-8.837 0-16 7.163-16 16h4a12 12 0 0124 0h4c0-8.837-7.163-16-16-16z"
                  fill="#38bdf8"
                />
                <path
                  d="M24 40c8.837 0 16-7.163 16-16h-4a12 12 0 01-24 0h-4c0 8.837 7.163 16 16 16z"
                  fill="#bae6fd"
                />
              </svg>
              <p className="mt-4 text-lg font-semibold text-gray-800 text-center">
                Các kỹ thuật ghi nhớ được khoa học chứng minh
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center shadow-sm">
              <svg
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4"
              >
                <rect
                  x="8"
                  y="12"
                  width="32"
                  height="24"
                  rx="6"
                  fill="#a78bfa"
                />
                <path
                  d="M16 24h16M16 28h8"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="mt-4 text-lg font-semibold text-gray-800 text-center">
                Học nhanh hơn gấp hai lần so với trên lớp
              </p>
            </div>
            {/* Card 3 (highlight) */}
            <div className="bg-emerald-50 rounded-xl p-6 flex flex-col items-center shadow-lg border-2 border-primary-600">
              <svg
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4"
              >
                <circle cx="24" cy="24" r="20" fill="#34d399" />
                <circle cx="24" cy="24" r="12" fill="#fff" />
                <circle cx="24" cy="24" r="6" fill="#34d399" />
              </svg>
              <p className="mt-4 text-lg font-semibold text-gray-800 text-center">
                Học bằng cách đắm mình trong ngôn ngữ, như thể bạn đang sống ở
                đó vậy.
              </p>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Học ngôn ngữ thực sự được sử dụng trong đời sống.
              </p>
            </div>
            {/* Card 4 */}
            <div className="bg-rose-50 rounded-xl p-6 flex flex-col items-center shadow-sm">
              <svg
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4"
              >
                <path
                  d="M24 8l4 12h12l-10 7.5L32 40l-8-6-8 6 2-12.5L8 20h12z"
                  fill="#fb7185"
                />
              </svg>
              <p className="mt-4 text-lg font-semibold text-gray-800 text-center">
                Bao quát mọi thứ từ kiến thức thiết yếu đến mục tiêu dài hạn
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
