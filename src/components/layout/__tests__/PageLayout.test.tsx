import { render, screen } from "@testing-library/react";
import PageLayout from "../PageLayout";
import { Wallet } from "lucide-react";

describe("PageLayout", () => {
  it("renders title, description, icon, and children", () => {
    render(
      <PageLayout
        title="Test Page"
        description="A test description"
        icon={Wallet}
      >
        <div data-testid="child">Content</div>
      </PageLayout>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Test Page"
    );
    expect(screen.getByText("A test description")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(
      <PageLayout title="Minimal Page" icon={Wallet}>
        <div>Content</div>
      </PageLayout>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Minimal Page"
    );
  });

  it("renders actions slot", () => {
    render(
      <PageLayout
        title="Page"
        icon={Wallet}
        actions={<button>Action</button>}
      >
        <div>Content</div>
      </PageLayout>
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
