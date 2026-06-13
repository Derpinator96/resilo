export default function MeshBackground() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-slate-50 pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-200/30 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[20%] w-[40vw] h-[40vw] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none z-0" />
    </>
  )
}
