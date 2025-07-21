package com.maven.OnlineShoppingSB.helperClasses;

import java.util.List;

public class GroupCheckerResult {
    private boolean eligible;
    private List<String> matchedConditions;

    public GroupCheckerResult(boolean eligible, List<String> matchedConditions) {
        this.eligible = eligible;
        this.matchedConditions = matchedConditions;
    }

    public boolean isEligible() {
        return eligible;
    }

    public List<String> getMatchedConditions() {
        return matchedConditions;
    }
}
