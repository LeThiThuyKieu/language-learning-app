import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
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
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Học một ngoại ngữ để sống
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Những mẫu câu hữu ích trong cuộc sống hàng ngày. Được dạy với những video clip của người bản ngữ thực sự.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto">
            Bắt đầu học
          </button>
          <button className="px-8 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-base rounded-lg transition-all duration-200 w-full sm:w-auto">
            Tìm hiểu thêm
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Tại sao chọn Leon?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: "📚", title: "Khóa học đa dạng", desc: "Hơn 100 khóa học từ cơ bản đến nâng cao" },
            { icon: "🎯", title: "Phương pháp hiệu quả", desc: "Học qua video clip thực tế, giọng người bản ngữ" },
            { icon: "🏆", title: "Sertification", desc: "Nhận chứng chỉ sau khi hoàn thành khóa học" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-12 bg-white rounded-xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Công nghệ sử dụng
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "React 18",
            "TypeScript",
            "Spring Boot",
            "MySQL",
            "MongoDB",
            "Tailwind CSS",
            "JWT Auth",
            "Vite",
          ].map((tech) => (
            <div
              key={tech}
              className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-lg text-center border border-primary-200"
            >
              <span className="font-semibold text-primary-900">{tech}</span>
            </div>
          ))}
        </div>
      </section>

      {/* API Status Section */}
      <section className="py-8">
        <div className="bg-white rounded-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Trạng thái hệ thống
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">Frontend (React + TypeScript)</span>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Running</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">Backend API (Spring Boot)</span>
              <div className="flex items-center gap-2">
                {apiStatus === "checking" && (
                  <>
                    <Loader className="w-5 h-5 animate-spin text-primary-600" />
                    <span className="font-semibold text-primary-600">Checking...</span>
                  </>
                )}
                {apiStatus === "online" && (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-600">Online</span>
                  </>
                )}
                {apiStatus === "offline" && (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span className="font-semibold text-rose-600">Offline</span>
                  </>
                )}
              </div>
            </div>

            {apiStatus === "offline" && (
              <div className="p-4 bg-primary-50 rounded-lg border-l-4 border-primary-600">
                <p className="text-primary-900 font-semibold">
                  💡 Lưu ý: Hãy đảm bảo Spring Boot đang chạy tại <code className="bg-primary-100 px-2 py-1 rounded font-mono">http://localhost:8080</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
