import { FeedPage } from "@/components/pages/FeedPage";

export const metadata = {
  title: "The Little Picture — The Archive of Small Things",
};

export default function TheLittlePicturePage() {
  return <FeedPage initialTags={["The Little Picture"]} />;
}
