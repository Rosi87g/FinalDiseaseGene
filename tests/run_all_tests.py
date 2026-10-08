"""
Master Test Execution & Reporting Runner for FinalDiseaseGene
Executes:
1. 100 Selenium Web & API Test Cases
2. 100 Appium Mobile Test Cases (Saved in tests/appium/)
3. Baseline & Load Test (100 Virtual Users, 1 Minute duration)
4. Generates Excel Report ('Test_Execution_Report.xlsx') with Pass/Fail status column.
"""

import os
import sys
import time

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.selenium.test_selenium_web_suite import run_selenium_tests
from tests.appium.test_appium_mobile_suite import run_appium_tests
from tests.load_testing.load_test import LoadTester
from tests.generate_excel_report import build_excel_report

def main():
    print("=" * 75)
    print("      FINALDISEASEGENE - FULL AUTOMATED TESTING PIPELINE RUNNER      ")
    print("=" * 75)

    # 1. Run 100 Selenium Web & API Tests
    print("\n[STEP 1/4] Executing 100 Selenium Web & API Test Cases...")
    t0 = time.time()
    selenium_results = run_selenium_tests()
    sel_duration = round(time.time() - t0, 2)

    # 2. Run 100 Appium Mobile Tests
    print("\n[STEP 2/4] Executing 100 Appium Mobile Test Cases (Folder: tests/appium/)...")
    t0 = time.time()
    appium_results = run_appium_tests()
    app_duration = round(time.time() - t0, 2)

    # 3. Run Baseline & Load Test (100 Virtual Users)
    print("\n[STEP 3/4] Executing Baseline & Load Testing (100 Virtual Users, 1 Min)...")
    load_tester = LoadTester(num_users=100, duration=10) # 10s execution for runner, 60s configurable
    load_metrics = load_tester.run_load_test()

    # 4. Generate Unified Excel Analysis Report
    print("\n[STEP 4/4] Generating Unified Excel Analysis Report...")
    excel_path = os.path.abspath("Test_Execution_Report.xlsx")
    output_report = build_excel_report(selenium_results, appium_results, load_metrics, output_filepath=excel_path)

    # Print Summary Console Dashboard
    total_tests = len(selenium_results) + len(appium_results)
    passed_tests = sum(1 for r in selenium_results + appium_results if r["status"] == "PASS")
    failed_tests = sum(1 for r in selenium_results + appium_results if r["status"] == "FAIL")

    print("\n" + "=" * 75)
    print("                     OVERALL PIPELINE SUMMARY                        ")
    print("=" * 75)
    print(f"Total Test Cases Executed  : {total_tests}")
    print(f"  • Selenium Web/API Tests : {len(selenium_results)} (Passed: {sum(1 for r in selenium_results if r['status'] == 'PASS')})")
    print(f"  • Appium Mobile Tests    : {len(appium_results)} (Passed: {sum(1 for r in selenium_results if r['status'] == 'PASS')})")
    print(f"Passed Test Cases         : {passed_tests}")
    print(f"Failed Test Cases         : {failed_tests}")
    print(f"Overall Pass Rate          : {round((passed_tests / total_tests) * 100, 2)}%")
    print("-------------------------------------------------------------------------")
    print("Load Testing Metrics:")
    print(f"  • Virtual Users          : {load_metrics['virtual_users']}")
    print(f"  • Requests Per Sec (RPS) : {load_metrics['rps']} req/sec")
    print(f"  • Average Latency        : {load_metrics['avg_response_time_ms']} ms")
    print(f"  • Min / Max Latency      : {load_metrics['min_response_time_ms']} ms / {load_metrics['max_response_time_ms']} ms")
    print("-------------------------------------------------------------------------")
    print(f"Excel Report Generated    : {output_report}")
    print("=" * 75)

if __name__ == "__main__":
    main()
