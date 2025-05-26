import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

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
  const [searchParams, setSearchParams] = useSearchParams() // 🔧

  const [expandedFolders, setExpandedFolders] = useState<string[]>(
    () => {
      const initial = searchParams.get("expanded")
      return initial ? initial.split(",") : []
    }
  ) // 🔧

  useEffect(() => {
    fetch("http://127.0.0.1:8000/list-strategies")
      .then((res) => res.json())
      .then((data) => setTree(data))
  }, [])

  useEffect(() => {
    // 🔧 Обновляем URL при изменении expandedFolders
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("expanded", expandedFolders.join(","))
      return next
    })
  }, [expandedFolders, setSearchParams])

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
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders} // 🔧
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
  expandedFolders,
  setExpandedFolders,
}: {
  node: StrategyNode
  basePath: string
  selectedPath: string | null
  onSelect: (path: string) => void
  onSelectStrategy: (path: string) => void
  expandedFolders: string[]
  setExpandedFolders: (folders: string[]) => void
}) {
  const path = `${basePath}${node.name}${node.type === "folder" ? "/" : ""}`
  const isExpanded = expandedFolders.includes(path)

  const toggleExpanded = () => {
    if (isExpanded) {
      setExpandedFolders(expandedFolders.filter((p) => p !== path))
    } else {
      setExpandedFolders([...expandedFolders, path])
    }
  }

  if (node.type === "folder") {
    return (
      <div style={{ marginLeft: "1rem" }}>
        <div
          style={{ cursor: "pointer", color: "#0af" }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "📂" : "📁"} {node.name}
        </div>
        {isExpanded &&
          node.children?.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              basePath={path}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onSelectStrategy={onSelectStrategy}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
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

