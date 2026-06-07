// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { screen } from "@testing-library/dom"
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