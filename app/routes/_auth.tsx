import { Outlet } from "@remix-run/react"

import { SiteLayout } from "~/components/layout/site-layout"

/**
 * EDITME: Change to a different auth layout if want to
 */

export default function AuthLayoutRoute() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  )
}
