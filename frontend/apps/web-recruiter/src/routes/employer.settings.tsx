import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";

export const Route = createFileRoute("/employer/settings")({
  head: () => ({ meta: [{ title: "Cài đặt" }] }),
  component: () => (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-5">Cài đặt</h1>
      <div className="card-surface p-6 space-y-4">
        <h2 className="font-semibold">Thông tin tài khoản</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-sm">Tên đầy đủ</label><input defaultValue="Trần Thị HR" className="mt-1 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" /></div>
          <div><label className="text-sm">Email</label><input defaultValue="hr@fpt.com.vn" className="mt-1 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" /></div>
        </div>
        <Button>Lưu thay đổi</Button>
      </div>
    </div>
  ),
});
