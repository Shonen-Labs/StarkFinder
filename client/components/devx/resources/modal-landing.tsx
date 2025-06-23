"use client";


import { Button } from "@/components/ui/button";
import {RocketLaunchIcon} from "@/components/icons";
import Link from "next/link";

export function ModalLanding() {

  return (    
        <Button size="landing" variant="primary">
          <Link href={`/devx`}>
          Launch App
          </Link>
          <RocketLaunchIcon />
        </Button>
  );
}
