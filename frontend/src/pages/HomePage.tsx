import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  useEffect(() => {
    // Test API connection
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
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Chào mừng đến với Language Learning App
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Học ngoại ngữ một cách hiệu quả và thú vị
        </p>

        {/* Test Status Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🧪 Test Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-medium text-gray-700">
                  Frontend (React + TypeScript)
                </span>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Running</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-medium text-gray-700">
                  Backend API (Spring Boot)
                </span>
                <div className="flex items-center gap-2">
                  {apiStatus === "checking" && (
                    <>
                      <Loader className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="font-semibold text-blue-600">
                        Checking...
                      </span>
                    </>
                  )}
                  {apiStatus === "online" && (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="font-semibold text-green-600">
                        Online
                      </span>
                    </>
                  )}
                  {apiStatus === "offline" && (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="font-semibold text-red-600">
                        Offline
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong> Lưu ý:</strong> Nếu Backend API hiển thị "Offline",
                  hãy đảm bảo Spring Boot đang chạy tại{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    http://localhost:8080
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Bắt đầu học
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Tìm hiểu thêm
          </button>
        </div>

        {/* Tech Stack Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Công nghệ sử dụng
          </h3>
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
                className="bg-white p-3 rounded-lg shadow border border-gray-200 text-center"
              >
                <span className="text-sm font-medium text-gray-700">
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
