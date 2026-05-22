const frontendUrl = "https://website-expense-tracker-f.vercel.app/";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6fbf7] px-6 py-12 text-slate-950">
      <div className="absolute left-[-80px] top-[-80px] h-56 w-56 animate-pulse rounded-full bg-emerald-200/60 blur-3xl" />
      <div className="absolute bottom-[-90px] right-[-70px] h-64 w-64 animate-pulse rounded-full bg-sky-200/60 blur-3xl" />

      <section className="relative w-full max-w-2xl text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 animate-bounce items-center justify-center rounded-3xl bg-white shadow-lg shadow-emerald-200/60 ring-1 ring-emerald-100">
          <svg
            aria-hidden="true"
            className="h-10 w-10 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
            <path
              d="M8.5 12h7M12 8.5v7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        </div>

        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          API đang hoạt động
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Đây là trang nền cho Expense Tracker API
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Nếu bạn đang tìm giao diện sử dụng ứng dụng, có thể bạn đã vào nhầm
          trang xử lý API. Hãy chuyển sang frontend để tiếp tục quản lý chi tiêu
          nhé.
        </p>

        <div className="mt-8 flex justify-center">
          <a
            className="group inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
            href={frontendUrl}
          >
            Chuyển sang frontend
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Endpoint backend vẫn sẵn sàng phục vụ các request từ ứng dụng.
        </p>
      </section>
    </main>
  );
}
