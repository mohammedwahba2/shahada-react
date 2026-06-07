// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "./context/ThemeContext"
import App from "./App"

const renderWithTheme = () =>
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )

it("renders SHAHADA heading", () => {
  renderWithTheme()
  expect(screen.getByRole("heading", { name: "SHAHADA" })).toBeInTheDocument()
})

it("shows start button before recording", () => {
  renderWithTheme()
  expect(screen.getByText("Yes, I'm ready")).toBeInTheDocument()
})