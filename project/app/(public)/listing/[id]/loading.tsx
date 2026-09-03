export default function ListingDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-[440px] bg-mist" />
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_340px] gap-14 px-8 py-12 max-[860px]:grid-cols-1">
        <div className="space-y-4">
          <div className="h-24 rounded bg-mist" />
          <div className="h-8 w-1/3 rounded bg-mist" />
          <div className="h-40 rounded bg-mist" />
        </div>
        <div className="h-72 rounded-lg bg-mist" />
      </div>
    </div>
  );
}
