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

  // Card data for section 3
  const learningFeatures = [
    {
      color: "bg-sky-100",
      icon: (
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 48 48"
          className="mb-4"
        >
          <circle cx="24" cy="24" r="20" fill="#38bdf8" />
          <path
            d="M24 16v8l6 3"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: "Vocabulary",
      desc: "Learn English Vocabulary",
    },
    {
      color: "bg-orange-100",
      icon: (
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 48 48"
          className="mb-4"
        >
          <circle cx="24" cy="24" r="20" fill="#fb923c" />
          <path
            d="M24 18v12"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="32" r="2" fill="#fff" />
        </svg>
      ),
      title: "Expressions",
      desc: "Learn Expressions and Idioms",
    },
    {
      color: "bg-emerald-100",
      icon: (
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 48 48"
          className="mb-4"
        >
          <circle cx="24" cy="24" r="20" fill="#34d399" />
          <rect
            x="18"
            y="18"
            width="12"
            height="12"
            rx="2"
            fill="#fff"
          />
        </svg>
      ),
      title: "Reading",
      desc: "Reading comprehension",
    },
    {
      color: "bg-amber-100",
      icon: (
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 48 48"
          className="mb-4"
        >
          <circle cx="24" cy="24" r="20" fill="#fbbf24" />
          <path
            d="M18 30c2-2 10-2 12 0"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="22" r="4" fill="#fff" />
        </svg>
      ),
      title: "Pronunciation",
      desc: "Pronunciation Lessons",
    },
    {
      color: "bg-rose-100",
      icon: (
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 48 48"
          className="mb-4"
        >
          <rect width="48" height="48" rx="20" fill="#fb7185" />
          <path
            d="M16 32l8-16 8 16"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: "Grammar",
      desc: "English Grammar lessons",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="min-h-[70vh] flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-4 py-16 gap-8">
        {/* Text */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-center text-center md:text-left space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Học ngoại ngữ <br />
            <span className="text-primary-600">để sống</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-lg">
            Những mẫu câu hữu ích trong cuộc sống hàng ngày. Được dạy với những video
            clip của người bản ngữ thực sự.
          </p>
          <div className="flex gap-4 mt-2">
            <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-200">
              Bắt đầu học
            </button>
            <button className="px-8 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-lg rounded-lg transition-all duration-200">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
        {/* Image */}
        <div className="flex-1 flex items-center justify-center">
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
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-2">
            Tại sao nên sử dụng{" "}
            <span className="text-primary-600">Lion</span>?
          </h2>
          <div className="w-24 h-2 bg-primary-600 mx-auto mb-8 rounded-full opacity-30"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="group bg-blue-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 border-2 border-transparent cursor-pointer">
              <svg
                width="56"
                height="56"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <circle cx="24" cy="24" r="20" fill="#38bdf8" />
              </svg>
              <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                Các kỹ thuật ghi nhớ được khoa học chứng minh
              </p>
            </div>
            {/* Card 2 */}
            <div className="group bg-purple-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 border-2 border-transparent cursor-pointer">
              <svg
                width="56"
                height="56"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <rect x="8" y="12" width="32" height="24" rx="6" fill="#a78bfa" />
              </svg>
              <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                Học nhanh hơn gấp hai lần so với trên lớp
              </p>
            </div>
            {/* Card 3 (highlight) */}
            <div className="group bg-emerald-50 rounded-2xl p-8 flex flex-col items-center shadow-lg border-2 border-primary-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-emerald-400 cursor-pointer">
              <svg
                width="56"
                height="56"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <circle cx="24" cy="24" r="20" fill="#34d399" />
                <circle cx="24" cy="24" r="12" fill="#fff" />
                <circle cx="24" cy="24" r="6" fill="#34d399" />
              </svg>
              <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                Học bằng cách đắm mình trong ngôn ngữ, như thể bạn đang sống ở
                đó vậy.
              </p>
              <p className="mt-2 text-base text-gray-600 text-center">
                Học ngôn ngữ thực sự được sử dụng trong đời sống.
              </p>
            </div>
            {/* Card 4 */}
            <div className="group bg-rose-50 rounded-2xl p-8 flex flex-col items-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-rose-300 border-2 border-transparent cursor-pointer">
              <svg
                width="56"
                height="56"
                fill="none"
                viewBox="0 0 48 48"
                className="mb-4 group-hover:scale-110 transition-transform duration-300"
              >
                <path
                  d="M24 8l4 12h12l-10 7.5L32 40l-8-6-8 6 2-12.5L8 20h12z"
                  fill="#fb7185"
                />
              </svg>
              <p className="mt-4 text-xl font-bold text-gray-800 text-center">
                Bao quát mọi thứ từ kiến thức thiết yếu đến mục tiêu dài hạn
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Section: Learning Features */}
      <section className="py-16 bg-gradient-to-r from-orange-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center">
                Learn English with{" "}
                <span className="text-primary-600">Lion</span>{" "}
              </h2>
            </div>
            <p className="text-lg md:text-xl text-gray-600 text-center max-w-2xl">
              Lion is a language learning platform that makes your learning process
              faster and easier.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            {learningFeatures.map((f, i) => (
              <div
                key={i}
                className={`group ${f.color} rounded-3xl p-8 flex flex-col items-center shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary-600 border-2 border-transparent cursor-pointer`}
              >
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="mt-2 text-2xl font-extrabold text-gray-900 text-center">
                  {f.title}
                </h3>
                <p className="mt-2 text-lg text-gray-700 text-center">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
