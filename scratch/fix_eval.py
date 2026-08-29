import re

def fix_eval():
    with open('frontend/app/evaluation/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    hook_str = """  const handleRunEvaluation = async () => {
    setIsRunningEvaluation(true);

    const steps = [
      "Loading held-out dataset (N = 150)...",
      "Running Naive Retry baseline engine...",
      "Synthesizing RECLAIM multi-step recovery strategies...",
      "Evaluating Layer 3 deterministic policy guardrails...",
      "Executing Razorpay verification telemetry...",
      "Calculating financial uplift, error rates & confusion matrix...",
      "Evaluation complete."
    ];

    for (let i = 0; i < steps.length; i++) {
      setEvalProgressStep(steps[i]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/evaluation/runs`, { method: "POST" });
      const apiRun = await response.json();
      
      const frontendReport = generateEvaluationReport();
      frontendReport.runId = apiRun.run_id;
      if (apiRun.metrics) {
         // Merge API metrics if they exist
         frontendReport.metrics = {
           ...frontendReport.metrics,
           reclaim: {
             ...frontendReport.metrics.reclaim,
             recoveredCases: apiRun.metrics.recovered_cases || frontendReport.metrics.reclaim.recoveredCases,
             recoveredAmount: apiRun.metrics.recovered_amount || frontendReport.metrics.reclaim.recoveredAmount,
             policyBlocks: apiRun.metrics.policy_blocks || frontendReport.metrics.reclaim.policyBlocks
           }
         };
      }
      setReport(frontendReport);
      
      toast({
        title: "Evaluation Completed",
        description: `Run ${apiRun.run_id} finished successfully.`,
        type: "success"
      });
    } catch (e) {
      toast({ title: "Evaluation Failed", description: "Failed to run evaluation on backend.", type: "error" });
    } finally {
      setIsRunningEvaluation(false);
      setEvalProgressStep("");
    }
  };"""

    content = re.sub(
        r'  const handleRunEvaluation = async \(\) => \{[\s\S]*?    setEvalProgressStep\(""\);\n  \};',
        hook_str,
        content,
        flags=re.MULTILINE
    )

    with open('frontend/app/evaluation/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_eval()
