import type { Metadata } from "next";
import { getCities, getWards } from "@/lib/data";
import seedData from "@/mocks/seed_data.json";
import { CitizenPortalView } from "@/components/citizen/CitizenPortalView";
import type { WardStateDto } from "@/lib/data/schemas";

export const metadata: Metadata = {
  title: "Citizen Air Quality Portal | AirTrace MP",
  description:
    "Ward-level air quality advisory, pollution source tracking, and health protection advice for Madhya Pradesh citizens.",
  manifest: "/manifest.json",
};

export default async function CitizenPage() {
  const cities = await getCities();
  const initialCityId = cities[0]?.id || "bhopal";
  const initialWards = await getWards(initialCityId);

  // Cast mock ward_state to WardStateDto[]
  const allWardStates = seedData.ward_state as unknown as WardStateDto[];

  return (
    <main className="min-h-screen bg-background">
      <CitizenPortalView
        cities={cities}
        initialCityId={initialCityId}
        initialWards={initialWards}
        allWardStates={allWardStates}
      />
    </main>
  );
}
