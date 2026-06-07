// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { Certificate } from "./Certificate"
it("shows name input before generating", () => {
  render(<Certificate onRestart={vi.fn()} />)
  expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument()
})

it("disables generate button when name is empty", () => {
  render(<Certificate onRestart={vi.fn()} />)
  expect(screen.getByText("Generate certificate")).toBeDisabled()
})