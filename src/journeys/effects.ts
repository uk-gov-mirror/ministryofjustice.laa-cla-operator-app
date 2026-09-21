import type { Deps } from "#src/journeys/api.js";
import { type EffectFunctionExpr, type EffectFunctionContext, EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";
import { FIRST_PAGE, getAuthenticatedAxios, getPageNumberFromQuery, getSearchParamFromAnswers, setPaginatedSearchData, SEARCH_PAGE_SIZE } from "#src/journeys/helpers/effectHelpers.js";


export interface InboundCallEffectShape {
    GetAllCases: () => EffectFunctionExpr;
    SearchCases: () => EffectFunctionExpr;
    SearchCasesPagination: () => EffectFunctionExpr;
    CreateCase: () => EffectFunctionExpr;
}

type InboundCallEffectsImplementation = (deps: Deps) => (context: EffectFunctionContext) => Promise<void>;

export const InboundCallEffectsImplementation: Record<keyof InboundCallEffectShape, InboundCallEffectsImplementation> = {

    /**
     * Implementation of the effect for retrieving all cases.
     * @param {Deps} deps - The dependencies required for the effect.
     * @returns {(context: EffectFunctionContext) => Promise<void>} Effect function bound to dependencies.
     */
    GetAllCases: (deps: Deps) => async (context: EffectFunctionContext) => {
       const authenticatedAxiosState = getAuthenticatedAxios(context);

       const result = await deps.caseApi.getAllCases(authenticatedAxiosState);
       context.setData("allCases", result);
    },


    /**
     * Implementation of the effect for searching cases based on user input.
     * @param {Deps} deps - The dependencies required for the effect.
     * @returns {(context: EffectFunctionContext) => Promise<void>} Effect function bound to dependencies.
     */
    SearchCases: (deps: Deps) => async (context: EffectFunctionContext) => {
       const authenticatedAxiosState = getAuthenticatedAxios(context);
       const searchParam = getSearchParamFromAnswers(context);

        context.setData("searchParam", searchParam);
        const result = await deps.caseApi.searchCases(authenticatedAxiosState, {
           query: searchParam,
           pageSize: SEARCH_PAGE_SIZE,
           pageNumber: FIRST_PAGE,
       });

        setPaginatedSearchData(context, result, FIRST_PAGE);
    },

    /**
     * Implementation of the effect for handling pagination of search results.
     * @param {Deps} deps - The dependencies required for the effect.
     * @returns {(context: EffectFunctionContext) => Promise<void>} Effect function bound to dependencies.
     */
    SearchCasesPagination: (deps: Deps) => async (context: EffectFunctionContext) => {
       const authenticatedAxiosState = getAuthenticatedAxios(context);
       const searchParam = String(context.getQueryParam("q"));
       
       context.setData("searchParam", searchParam);
    
       const result = await deps.caseApi.searchCases(authenticatedAxiosState, {
           query: searchParam,
           pageSize: SEARCH_PAGE_SIZE,
           pageNumber: getPageNumberFromQuery(context),
       });

        setPaginatedSearchData(context, result, getPageNumberFromQuery(context));
    },

    /**
     * Implementation of the effect for creating a new case based on user input.
     * @param {Deps} deps - The dependencies required for the effect.
     * @returns {(context: EffectFunctionContext) => Promise<void>} Effect function bound to dependencies.
     */
    CreateCase: (deps: Deps) => async (context: EffectFunctionContext) => {
       const authenticatedAxiosState = getAuthenticatedAxios(context);
       const { reference } = await deps.caseApi.createCase(authenticatedAxiosState);
       context.setData("createdCaseRef", reference);
    },
};

export const InboundCallEffectsRegistry = new EffectRegistry<Deps>();

export const InboundCallEffects: InboundCallEffectShape = {
    GetAllCases: InboundCallEffectsRegistry.register("GetAllCases", InboundCallEffectsImplementation.GetAllCases),
    SearchCases: InboundCallEffectsRegistry.register("SearchCases", InboundCallEffectsImplementation.SearchCases),
    SearchCasesPagination: InboundCallEffectsRegistry.register("SearchCasesPagination", InboundCallEffectsImplementation.SearchCasesPagination),
    CreateCase: InboundCallEffectsRegistry.register("CreateCase", InboundCallEffectsImplementation.CreateCase),
}
