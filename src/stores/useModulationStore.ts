import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  ModulationSource,
  ModulationRoute,
  ModulationRoutesMap,
  ModulationSourceValuesMap,
  ParameterMetadata,
  ParameterMetadataMap,
  ModulationState,
  ModulationActions,
  ModulationStore,
} from "../types";

/**
 * Initialize source values with all sources set to 0
 */
const initializeSourceValues = (): ModulationSourceValuesMap => {
  // Initialize all modulation sources to 0
  // TypeScript knows this creates a complete Record<ModulationSource, number>
  return Object.values(ModulationSource).reduce((acc, source) => {
    if (source !== ModulationSource.NONE) {
      acc[source] = 0;
    }
    return acc;
  }, {} as ModulationSourceValuesMap);
};

/**
 * Update the active sources set based on current routes
 */
const updateActiveSources = (
  routes: ModulationRoutesMap
): Set<ModulationSource> => {
  const activeSources = new Set<ModulationSource>();

  // Iterate through all routes and collect unique sources
  Object.values(routes).forEach((routeArray) => {
    routeArray.forEach((route) => {
      if (route.source !== ModulationSource.NONE) {
        activeSources.add(route.source);
      }
    });
  });

  return activeSources;
};

/**
 * Modulation Store
 *
 * Manages the modulation matrix system:
 * - Routing modulation sources to parameters
 * - Tracking current modulation source values
 * - Calculating modulated parameter values
 * - Parameter metadata registry
 */
export const useModulationStore = create<ModulationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      routes: {},
      sourceValues: initializeSourceValues(),
      parameters: {},
      activeSources: new Set<ModulationSource>(),

      // Actions
      registerParameter: (metadata: ParameterMetadata) => {
        set((state) => ({
          parameters: {
            ...state.parameters,
            [metadata.paramId]: metadata,
          },
        }));
      },

      addModulationRoute: (
        paramId: string,
        slotIndex: number,
        source: ModulationSource,
        amount: number,
        bipolar: boolean = false
      ) => {
        set((state) => {
          // Get existing routes for this parameter
          const existingRoutes = state.routes[paramId] || [];

          // Find if route already exists for this slot
          const routeIndex = existingRoutes.findIndex(
            (route) => route.slotIndex === slotIndex
          );

          // Create new route
          const newRoute: ModulationRoute = {
            paramId,
            slotIndex,
            source,
            amount,
            bipolar,
          };

          // Update or add route
          let updatedRoutes: ModulationRoute[];
          if (routeIndex >= 0) {
            // Replace existing route
            updatedRoutes = [...existingRoutes];
            updatedRoutes[routeIndex] = newRoute;
          } else {
            // Add new route
            updatedRoutes = [...existingRoutes, newRoute];
          }

          // Update routes map
          const newRoutesMap = {
            ...state.routes,
            [paramId]: updatedRoutes,
          };

          // Update active sources
          const newActiveSources = updateActiveSources(newRoutesMap);

          return {
            routes: newRoutesMap,
            activeSources: newActiveSources,
          };
        });
      },

      removeModulationRoute: (paramId: string, slotIndex: number) => {
        set((state) => {
          const existingRoutes = state.routes[paramId];
          if (!existingRoutes) return state;

          // Filter out the route for this slot
          const updatedRoutes = existingRoutes.filter(
            (route) => route.slotIndex !== slotIndex
          );

          // Update routes map
          const newRoutesMap = { ...state.routes };
          if (updatedRoutes.length === 0) {
            // Remove parameter entry if no routes remain
            delete newRoutesMap[paramId];
          } else {
            newRoutesMap[paramId] = updatedRoutes;
          }

          // Update active sources
          const newActiveSources = updateActiveSources(newRoutesMap);

          return {
            routes: newRoutesMap,
            activeSources: newActiveSources,
          };
        });
      },

      updateModulationAmount: (
        paramId: string,
        slotIndex: number,
        amount: number
      ) => {
        set((state) => {
          const existingRoutes = state.routes[paramId];
          if (!existingRoutes) return state;

          // Find and update the route
          const updatedRoutes = existingRoutes.map((route) =>
            route.slotIndex === slotIndex ? { ...route, amount } : route
          );

          return {
            routes: {
              ...state.routes,
              [paramId]: updatedRoutes,
            },
          };
        });
      },

      updateSourceValue: (source: ModulationSource, value: number) => {
        set((state) => ({
          sourceValues: {
            ...state.sourceValues,
            [source]: value,
          },
        }));
      },

      getModulatedValue: (paramId: string, baseValue: number): number => {
        const state = get();
        const routes = state.routes[paramId];

        // Return base value if no routes exist
        if (!routes || routes.length === 0) {
          return baseValue;
        }

        // Get parameter metadata for clamping
        const metadata = state.parameters[paramId];
        if (!metadata) {
          console.warn(
            `Parameter ${paramId} not registered. Returning base value.`
          );
          return baseValue;
        }

        // Calculate total modulation
        let modulationSum = 0;

        routes.forEach((route) => {
          // Skip if source is NONE
          if (route.source === ModulationSource.NONE) {
            return;
          }

          // Get source value (normalized -1 to +1)
          const sourceValue = state.sourceValues[route.source] || 0;

          // Scale by amount (0-100 percentage)
          const scaledValue = sourceValue * (route.amount / 100);

          // Apply bipolar/unipolar
          const modValue = route.bipolar
            ? scaledValue // Bipolar: -amount to +amount
            : Math.max(0, scaledValue); // Unipolar: 0 to +amount

          // Accumulate modulation
          modulationSum += modValue;
        });

        // Calculate final modulated value
        const modulatedValue =
          baseValue + modulationSum * (metadata.max - metadata.min);

        // Clamp to parameter range
        const clampedValue = Math.max(
          metadata.min,
          Math.min(metadata.max, modulatedValue)
        );

        return clampedValue;
      },

      getRoutesForParameter: (paramId: string): ModulationRoute[] => {
        const state = get();
        return state.routes[paramId] || [];
      },

      getActiveSources: (): Set<ModulationSource> => {
        return get().activeSources;
      },

      clearAllRoutes: () => {
        set({
          routes: {},
          activeSources: new Set<ModulationSource>(),
        });
      },
    }),
    {
      name: "modulation-store",
    }
  )
);

/**
 * Selectors for common queries
 */

/**
 * Check if a parameter has any active modulation routes
 */
export const selectHasModulation =
  (paramId: string) => (state: ModulationStore) => {
    const routes = state.routes[paramId];
    return routes && routes.length > 0;
  };

/**
 * Get the number of active modulation routes across all parameters
 */
export const selectTotalRouteCount = (state: ModulationStore) => {
  return Object.values(state.routes).reduce(
    (total, routes) => total + routes.length,
    0
  );
};

/**
 * Check if a specific modulation source is currently in use
 */
export const selectIsSourceActive =
  (source: ModulationSource) => (state: ModulationStore) => {
    return state.activeSources.has(source);
  };
