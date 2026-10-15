/**
 * The planner's choices, as state the route cards share with the planner: a
 * card's button picks its route, and the planner starts from it.
 */
export const usePlanner = () => {
  const { routes } = useAppConfig();
  return useState("planner", () => ({
    route: routes[0].id,
    /** The night, as the date picker holds it. */
    date: "2026-12-04",
    travellers: 2,
    fare: "seat",
  }));
};
