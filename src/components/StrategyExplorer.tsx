import { useEffect, useState } from "react"

type StrategyNode = {
  name: string
  type: "folder" | "file"
  children?: StrategyNode[]
}

export default function StrategyExplorer({
  onSelectStrategy,
}: {
  onSelectStrategy: (path: string) => void
}) {
  const [tree, setTree] = useState<StrategyNode[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/list-strategies")
      .then((res) => res.json())
      .then((data) => setTree(data))
  }, [])

  return (
    <div
      style={{
        padding: "1rem",
        color: "#ccc",
        fontSize: "0.9rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <h4>📂 Стратегии</h4>
      {tree.map((node) => (
        <TreeNode
          key={node.name}
          node={node}
          basePath=""
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
          onSelectStrategy={onSelectStrategy}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  basePath,
  selectedPath,
  onSelect,
  onSelectStrategy,
}: {
  node: StrategyNode
  basePath: string
  selectedPath: string | null
  onSelect: (path: string) => void
  onSelectStrategy: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const path = `${basePath}${node.name}${node.type === "folder" ? "/" : ""}`

  if (node.type === "folder") {
    return (
      <div style={{ marginLeft: "1rem" }}>
        <div
          style={{ cursor: "pointer", color: "#0af" }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "📂" : "📁"} {node.name}
        </div>
        {expanded &&
          node.children?.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              basePath={path}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onSelectStrategy={onSelectStrategy} // ✅ добавляем этот проп
            />
          ))}
      </div>
    )
  }

  return (
    <div
      style={{
        marginLeft: "2rem",
        cursor: "pointer",
        color: path === selectedPath ? "#fff" : "#ccc",
        background: path === selectedPath ? "#444" : "transparent",
        padding: "2px 6px",
        borderRadius: 4,
      }}
      onClick={() => onSelect(path)}
      onDoubleClick={() => onSelectStrategy(path)}
    >
      📄 {node.name}
    </div>
  )
}
