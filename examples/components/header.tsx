import Link from "next/link"
import { useState } from "react"

const pages: Array<{ title: string; url: string }> = [
    {
        title: "Stream",
        url: "/stream",
    },
]

export function Header({ selectedIndex }: { selectedIndex: number }) {
    const [open, setOpen] = useState(false)
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link href="/" passHref>
                    <a className="navbar-brand">co-share-peer-room examples</a>
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={() => setOpen(!open)}
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNavDropdown"
                    aria-controls="navbarNavDropdown"
                    aria-expanded="false"
                    aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`align-self-flex-end navbar-collapse ${open ? "" : "collapse"}`}>
                    <ul className="navbar-nav">
                        {pages.map(({ title, url }, index) => (
                            <li key={title} className="nav-item">
                                {index === selectedIndex ? (
                                    <span style={{ cursor: "pointer" }} className="active nav-link">
                                        {title}
                                    </span>
                                ) : (
                                    <Link href={url} passHref>
                                        <a className="nav-link">{title}</a>
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    )
}
