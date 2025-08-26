const express = require("express");
const router = express.Router();

/**
 * 获取通用数据
 */
router.get("", async (req, res) => {
  const pool = req.pool;
  const connection = await pool.getConnection();
  try {
    // 获取所有区域
    console.log("查询区域选项...");
    const [regions] = await connection.execute(
      'SELECT DISTINCT region as region, region as id FROM employee_roster WHERE region IS NOT NULL AND region != "" ORDER BY region'
    );
    // 获取所有部门
    console.log("查询部门选项...");
    const [departments] = await connection.execute(
      'SELECT DISTINCT department as department, department as id FROM employee_roster WHERE department IS NOT NULL AND department != "" ORDER BY department'
    );
    // 获取所有岗位
    console.log("查询岗位选项...");
    const [positions] = await connection.execute(
      'SELECT DISTINCT position as position, position as id FROM employee_roster WHERE position IS NOT NULL AND position != "" ORDER BY position'
    );
    // 获取组织区域（基于区域转换逻辑）
    const organizationRegions = [
      ...new Set(
        regions
          .map((row) => {
            const area = row.region;
            if (!area) return "";

            const areaStr = area.toString();

            if (areaStr === "总部") return "华东";
            if (areaStr === "合肥") return "华北";
            if (["杭州", "上海", "宁波", "义乌"].includes(areaStr))
              return "华东";
            return "华南";
          })
          .filter((region) => region !== "")
      ),
    ].sort();

    res.json({
      regions: [...new Set(regions)],
      departments: [...new Set(departments)],
      positions: [...new Set(positions)],
      organizationRegions: [...new Set(organizationRegions)],
    });
  } catch (error) {
    console.error("查询通用数据失败:", error);
    res.status(500).json({ error: "查询通用数据失败" });
  } finally {
    connection.release();
  }
});

module.exports = router;
