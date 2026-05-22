import {useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {authService} from "@/services/authService";
import toast from "react-hot-toast";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyEmailPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const emailFromQuery = query.get("email") || "";

  const [email] = useState(emailFromQuery);
  const [resending, setResending] = useState(false);
  const [processingToken, setProcessingToken] = useState(false);

  useEffect(() => {
    // emailFromQuery is used to prefill the email; do not toast immediately to avoid duplicates
    const token = query.get("token");
    const verified = query.get("verified");
    const error = query.get("error");

    if (token) {
      (async () => {
        setProcessingToken(true);
        try {
          await authService.verifyEmailToken(token);
          toast.success("Xác thực email thành công!");
          navigate("/login");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Xác thực thất bại");
        } finally {
          setProcessingToken(false);
        }
      })();
      return;
    }

    if (verified) {
      toast.success("Xác thực email thành công!", { id: 'verify-result' });
      // Optionally navigate to login after a short delay
      setTimeout(() => navigate('/login'), 2200);
      return;
    }

    if (error) {
      // backend encodes the message; decode for display
      try {
        const decoded = decodeURIComponent(error);
        toast.error(decoded, { id: 'verify-result' });
      } catch (e) {
        toast.error("Xác thực thất bại", { id: 'verify-result' });
      }
    }
  }, [emailFromQuery]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.sendVerification(email);
      toast.success("Đã gửi lại email xác thực", { id: 'verify-sent' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gửi lại thất bại");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff7f3] p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="text-center" style={{background: 'linear-gradient(135deg,#f97316 0%,#ea580c 100%)', padding: '28px'}}>
            <h1 className="text-white text-2xl font-extrabold">⚡ Lion</h1>
            <p className="text-white/90 uppercase text-xs tracking-widest mt-1">XÁC THỰC TÀI KHOẢN</p>
          </div>

          <div className="p-8">
            <p className="text-lg font-bold text-[#111827] mb-2">Xác nhận địa chỉ email của bạn</p>
            <p className="text-sm text-gray-500 mb-6">Đã gửi email xác thực tới <span className="font-medium">{email}</span>. Vui lòng mở email và nhấn nút "Xác thực địa chỉ email".</p>

            <div className="space-y-4">

              <div className="flex gap-3">
                <button type="button" disabled={processingToken || resending} onClick={handleResend} className="flex-1 bg-[#D84315] text-white py-3 rounded-lg font-semibold hover:bg-[#BF360C]">
                  {resending ? "Đang gửi..." : "Gửi lại email xác thực"}
                </button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <button type="button" onClick={() => navigate('/login')} className="text-[#6b7280] underline">Quay lại đăng nhập</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
